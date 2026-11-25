# Marketplace and the lock

Horae installs plugins from git, each pinned to one commit, and nothing updates itself. There
is no central registry: a **marketplace** is a git repository with an index, and anyone can run
one ([ADR 0004](https://github.com/horae-dev/horae/blob/main/docs/adr/0004-git-marketplace-with-sha-pinning.md)).

## The index

A marketplace is a repository holding `marketplace.json`. Each entry maps a plugin name and
each of its versions to the **full commit SHA** that the tag `v<version>` points to, with a tier:

```json
{ "plugins": [ { "name": "github", "repo": "https://github.com/horae-dev/plugin-github",
                 "versions": { "0.6.0": "3932c86bfd0dcd8a3389d3b5b5577458e745b4f9" },
                 "tier": "first-party" } ] }
```

- `tier` is `first-party` (horae-dev) or `community`. Only the default Horae marketplace,
  [horae-dev/marketplace](https://github.com/horae-dev/marketplace), can vouch for
  `first-party`.
- The marketplace's CI clones every entry, checks that the pinned commit exists and matches
  its tag, and validates its `plugin.yaml` with the core's validator. A nightly job runs each
  plugin's tests at its pinned commit against the core's `main`.
- An entry is added only for a tagged release.

An instance reads the marketplaces listed in `horae.yaml`, highest priority first (by default
only horae-dev/marketplace). A plugin that two of them list under different repositories needs
a pin to one of them:

```yaml
marketplaces:
  - https://github.com/horae-dev/marketplace
  - https://git.example.org/team/marketplace
marketplace_pins:
  coach: https://git.example.org/team/marketplace
```

## Installing

```sh
horae plugin search                       # what the configured marketplaces list
horae plugin resolve github@0.6.0         # the repository and the pinned commit
horae plugin add github@0.6.0             # install, approve, pin
```

`horae plugin add <name>@<version>`:

1. resolves the name in the configured marketplaces;
2. clones the repository over `https` and checks out the pinned commit, refusing if the tag
   `v<version>` and the commit disagree, or if `plugin.yaml` is invalid or names another plugin
   or version;
3. shows the permissions the plugin asks for, and asks you to approve them (with
   `--allow-host`, `--allow-local`, `--allow-path` or `--allow-read-path` you grant more, for
   example your vault);
4. writes the plugin's entry in `horae.lock`;
5. installs its dependencies in **its own venv**, from its `uv.lock`.

Nothing is half-installed: on any failure the instance is left as it was. A plugin that is not
first-party installs only when `horae.yaml` runs it with `runtime: container`
([Plugins and permissions](plugins.md#two-enforcement-tiers)).

**A direct install**, without a marketplace, names a repository and a full commit SHA:
`horae plugin add https://github.com/you/plugin-x@<full commit SHA>`. It has no tier, so it
needs `runtime: container` too.

**A pipeline pack** also gets its pipelines installed: each `pipelines/<name>.yaml` is validated
and copied to `<instance>/pipelines/<plugin>/<name>.yaml`. The install is refused, and nothing
is written, if a file is invalid, is a symbolic link, or would replace a file of yours. The
approval prompt lists each pipeline (its trigger, tools and skills, with a warning for tools of
other plugins), and the lock pins their digests. They run only once the pack is listed under
`plugins:` in `horae.yaml`.

## The lock

`horae.lock` is the list of what you approved. Per plugin: the version, the repository, the
**commit** (a full 40- or 64-hex id, never a tag or a short SHA) and the **approved
permissions**.

```yaml
schema_version: 1
plugins:
  ntfy:
    version: 0.3.4
    repo: https://github.com/horae-dev/plugin-ntfy
    commit: e5ae00bcb7f3296a750acec8305cb59351a13724
    permissions:
      network: [ntfy.example.org]
      secrets: [NTFY_TOKEN]
      paths: { write: [/instance/state/ntfy] }
      intents: [notify.push]
```

The plugin host loads only the plugins of the lock, and runs each with the permissions recorded
there, which may be wider than the manifest (your own server) but are never widened silently.
The lock's canonical form sorts plugins and lists, so a diff of the file shows only real
changes: keep it in your instance's git repository.

An instance is **not relocatable**: the lock holds absolute paths (the vault, for one), and
`plugins/` the absolute path of the interpreter that installed them. After a move,
`horae doctor` reports what no longer matches.

## Upgrading, removing, auditing

`horae plugin upgrade <name>[@<version>]`
:   Resolves the new version like `add`, installs it next to the old one, and shows what changes
    against the lock. A new host, local endpoint, secret, intent, path or pack pipeline must be
    approved again; grants you added with `--allow-*` are kept. The trees are swapped and the
    lock rewritten only after approval; on any failure the old version stays. A lower version
    needs `--allow-downgrade`.

`horae plugin remove <name>`
:   Refuses a plugin still listed under `plugins:` in `horae.yaml`. Otherwise deletes its tree,
    venv, lock entry and the pack pipelines that are still its own, and lists what it kept:
    secrets (unless `--delete-secrets`), the files it wrote and the run history.

`horae plugin audit`
:   Lists every plugin with its version, source, tier, permissions and last run, and reports
    drift between the lock and the disk (exit code 4), including a plugin that is not
    first-party but would not run in a container.

`--yes` re-installs, without asking, only what `horae.lock` already approves: a reproducible
install from a committed lock, for example in a Docker build.

!!! note "Proxy and custom CA"
    Git reads indexes and plugin repositories with a minimal environment. Only for those
    fetches it passes on `HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` (and the lowercase forms),
    `SSL_CERT_FILE` and `SSL_CERT_DIR`. The marketplace cache under `<state_dir>/marketplaces`
    is private (`0700`); `--offline` uses it without fetching.

## Listing your plugin

Tag a release, then open a pull request on the marketplace that adds the entry. Its
[contribution guide](https://github.com/horae-dev/marketplace/blob/main/CONTRIBUTING.md) says
what CI and reviewers check. See [Writing a plugin](../plugins/writing-a-plugin.md#6-publishing-to-the-marketplace).

!!! warning "Pre-release"
    The marketplace lists released versions of the first-party plugins, but the core itself is
    not released: `horae plugin add` runs from a checkout or a self-built image. Signed tags
    and a "tests pass on horae X.Y" badge are planned, not built.
