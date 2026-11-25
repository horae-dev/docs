# Project

Horae is open source under the Apache License 2.0, developed in the open in the
[horae-dev](https://github.com/horae-dev) organisation on GitHub.

| Page | What it covers |
|---|---|
| [Roadmap](roadmap.md) | the milestones, their goals and dates, and the risks that could stall the project |
| [Contributing](contributing.md) | how the project is built, how to pick up work, how to report a vulnerability |

## Repositories

| Repository | What it holds |
|---|---|
| [horae](https://github.com/horae-dev/horae) | the core: runtime, CLI, HTTP API, MCP server, SDK (`sdk/`), schemas, Dockerfile, deploy templates |
| [marketplace](https://github.com/horae-dev/marketplace) | `marketplace.json`, the plugin index, and the CI that verifies every pinned plugin |
| [template-plugin](https://github.com/horae-dev/template-plugin) | the template repository for a new plugin |
| `plugin-*`, `pack-*` | one repository per plugin or pack: see [Plugins](../plugins/index.md) |
| [docs](https://github.com/horae-dev/docs) | this site |

## Where it stands

Pre-release. The core is not released: run Horae from a checkout or a self-built image. (The plugin SDK, `horae-sdk`, is on PyPI as a 0.x release.) The design
decisions are provisional until the maintainer accepts them. Progress is tracked on the
[roadmap project](https://github.com/orgs/horae-dev/projects/1).
