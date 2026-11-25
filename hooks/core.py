"""MkDocs hooks: pages built from the core repository (horae-dev/horae).

At build time, nothing written to the tree:

1. Include files of the core checkout as reference pages (its README, ``schemas/README.md``,
   ``sdk/README.md``), so they are never copied by hand and never go stale.
2. Generate the CLI reference from the Typer app (``horae.cli:app``) when ``horae`` is importable.
3. Rewrite the relative links of those included files: to the page of this site that holds the
   target, or else to the file on GitHub.

The core checkout is ``$HORAE_CORE`` (default ``./core``, where CI checks it out). Without it, each
generated page is a short stub pointing at GitHub, so ``mkdocs serve`` works with no checkout.
"""

from __future__ import annotations

import html
import inspect
import os
import posixpath
import re
from pathlib import Path
from typing import Any

from mkdocs.config.defaults import MkDocsConfig
from mkdocs.structure.files import File, Files
from mkdocs.structure.pages import Page

REPO_URL = "https://github.com/horae-dev/horae"
HERE = Path(__file__).resolve().parents[1]
CORE = Path(os.environ.get("HORAE_CORE", HERE / "core")).resolve()

# Page of this site -> file of the core repository it is built from.
INCLUDED = {
    "reference/runtime.md": "README.md",
    "reference/schemas.md": "schemas/README.md",
    "reference/sdk.md": "sdk/README.md",
}
CLI_PAGE = "reference/cli.md"

# Core file -> page of this site that now holds it (the user docs moved here from horae/docs).
MOVED = {
    **{source: page for page, source in INCLUDED.items()},
    "docs/index.md": "index.md",
    "docs/quickstart.md": "get-started/quickstart.md",
    "docs/concepts.md": "concepts/index.md",
    "docs/writing-a-plugin.md": "plugins/writing-a-plugin.md",
    "docs/plugins/template.md": "plugins/template.md",
    "docs/security.md": "security/threat-model.md",
    "docs/mcp.md": "operate/mcp.md",
    "docs/operations/compose.md": "operate/compose.md",
    "docs/operations/coolify.md": "operate/coolify.md",
    "docs/operations/container-image.md": "operate/container-image.md",
    "docs/operations/retention-and-backups.md": "operate/retention-and-backups.md",
    "docs/operations/releasing.md": "operate/releasing.md",
    "docs/operations/plugin-containers.md": "security/plugin-containers.md",
    "docs/ROADMAP.md": "project/roadmap.md",
}
LITERAL = {"../../issues": f"{REPO_URL}/issues"}

_LINK = re.compile(r"(\]\()([^)\s]+)(\s+\"[^\"]*\")?(\))")
_REFDEF = re.compile(r"^(\s{0,3}\[[^\]]+\]:\s+)(\S+)", re.MULTILINE)
_FENCE = re.compile(r"^\s*(```+|~~~+)[\w+-]*\s*$")


def _stub(title: str, source: str) -> str:
    return (
        f"# {title}\n\n"
        f"Built from [`{source}`]({REPO_URL}/blob/main/{source}) of the core repository. "
        "Set `HORAE_CORE` to a checkout of horae-dev/horae to build this page locally.\n"
    )


def on_files(files: Files, config: MkDocsConfig) -> Files:
    titles = {"reference/runtime.md": "Runtime", "reference/schemas.md": "Schemas and decisions",
              "reference/sdk.md": "Plugin SDK"}
    for page, source in INCLUDED.items():
        path = CORE / source
        text = path.read_text(encoding="utf-8") if path.is_file() else _stub(titles[page], source)
        files.append(File.generated(config, page, content=text))
    files.append(File.generated(config, CLI_PAGE, content=_cli_reference()))
    return files


def on_page_markdown(markdown: str, page: Page, config: MkDocsConfig, files: Files) -> str:
    src_uri = page.file.src_uri
    origin = INCLUDED.get(src_uri)
    if origin is None:
        return markdown
    here = posixpath.dirname(origin)

    def rewrite(target: str) -> str:
        if target in LITERAL:
            return LITERAL[target]
        if re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*:", target) or target.startswith(("#", "/")):
            return target
        path, hash_mark, anchor = target.partition("#")
        suffix = f"#{anchor}" if hash_mark else ""
        resolved = posixpath.normpath(posixpath.join(here, path))
        if resolved.startswith(".."):
            return target
        moved = MOVED.get(resolved)
        if moved is not None:
            return posixpath.relpath(moved, posixpath.dirname(src_uri) or ".") + suffix
        kind = "tree" if (CORE / resolved).is_dir() else "blob"
        return f"{REPO_URL}/{kind}/main/{resolved.rstrip('/')}{suffix}"

    out: list[str] = []
    fenced = False
    for line in markdown.split("\n"):
        if _FENCE.match(line):
            fenced = not fenced
        elif not fenced:
            line = _LINK.sub(lambda m: f"{m[1]}{rewrite(m[2])}{m[3] or ''}{m[4]}", line)
            line = _REFDEF.sub(lambda m: f"{m[1]}{rewrite(m[2])}", line)
        out.append(line)
    return "\n".join(out)


# --- the CLI reference ------------------------------------------------------------------------


def _cli_reference() -> str:
    try:
        import typer.main
        from horae.cli import app
    except ImportError:
        return _stub("Command line", "src/horae/cli")
    root = typer.main.get_command(app)
    lines = [
        "# Command line",
        "",
        "Generated at build time from the Typer app (`horae.cli:app`) of the core repository, so it",
        "matches the code of `main`. `horae <command> --help` prints the same. Exit codes, the same",
        "for every command, are in [the runtime reference](runtime.md).",
        "",
    ]
    _render(root, "horae", 2, lines)
    return "\n".join(lines).rstrip() + "\n"


# Typer bundles its own copy of click, so parameters are told apart by `param_type_name`.
def _render(command: Any, path: str, level: int, lines: list[str]) -> None:
    ctx = command.make_context(path.split()[-1], [], resilient_parsing=True)
    usage = " ".join([path, *command.collect_usage_pieces(ctx)])
    lines += [f"{'#' * level} `{path}`", ""]
    if command.help:
        lines += ["```text", inspect.cleandoc(command.help), "```", ""]
    lines += ["Usage:", "", "```text", usage, "```", ""]
    arguments = [p for p in command.params if p.param_type_name == "argument"]
    options = [p for p in command.params if p.param_type_name == "option" and not _hidden(p)]
    if arguments:
        lines += ["| Argument | Description |", "|---|---|"]
        for arg in arguments:
            lines.append(f"| `{arg.human_readable_name}` | {_cell(_describe(arg))} |")
        lines.append("")
    if options:
        lines += ["| Option | Description |", "|---|---|"]
        for opt in options:
            names = ", ".join(f"`{n}`" for n in [*opt.opts, *opt.secondary_opts])
            lines.append(f"| {names} | {_cell(_describe(opt))} |")
        lines.append("")
    if hasattr(command, "list_commands"):
        for name in command.list_commands(ctx):
            sub = command.get_command(ctx, name)
            if sub is not None and not sub.hidden:
                _render(sub, f"{path} {name}", min(level + 1, 6), lines)


def _hidden(param: Any) -> bool:
    return bool(param.hidden) or param.name == "help"


def _describe(param: Any) -> str:
    help_text: Any = getattr(param, "help", None)
    parts = [html.escape(" ".join(str(help_text).split()), quote=False)] if help_text else []
    if param.required:
        parts.append("Required.")
    default = param.default
    if default not in (None, "", ()) and not callable(default) and param.show_default:
        if default is not False:
            parts.append(f"Default: `{default}`.")
    if param.envvar:
        envs = [param.envvar] if isinstance(param.envvar, str) else list(param.envvar)
        parts.append("Environment: " + ", ".join(f"`{e}`" for e in envs) + ".")
    return " ".join(parts)


def _cell(text: str) -> str:
    return text.replace("|", "\\|").replace("\n", " ")
