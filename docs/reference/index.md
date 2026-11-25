# Reference

These pages are built from the core repository at every build of this site, so they match the
code on `main`: nothing is copied by hand.

| Page | Built from | What it covers |
|---|---|---|
| [Command line](cli.md) | the `horae` Typer app | every command, option and exit code |
| [Runtime](runtime.md) | the core's [`README.md`](https://github.com/horae-dev/horae/blob/main/README.md) | getting started from a checkout, plugin install and upgrade, scheduling, the HTTP API, action links, exit codes, deployment |
| [Schemas and decisions](schemas.md) | [`schemas/README.md`](https://github.com/horae-dev/horae/blob/main/schemas/README.md) | the JSON Schemas of the contracts (pipeline, manifest, intents, lock, run record, instance) and every numbered design decision |
| [Plugin SDK](sdk.md) | [`sdk/README.md`](https://github.com/horae-dev/horae/blob/main/sdk/README.md) | `horae-sdk`: roles, intents, sinks, the manifest, testing helpers |

!!! note "Provisional decisions"
    Most numbered decisions in [Schemas and decisions](schemas.md) are marked "pending
    maintainer review". They describe what the code on `main` does; they can still change.

## Elsewhere in the core repository

- [Architecture decision records](https://github.com/horae-dev/horae/tree/main/docs/adr): why
  pipelines, intents, MCP, a git marketplace, the `claude-cli` backend and SQLite.
- [Design notes](https://github.com/horae-dev/horae/tree/main/docs/design): the threat model
  note, the retention workflow, the `claude-cli` backend, action links.
- [The plan](https://github.com/horae-dev/horae/blob/main/docs/PLAN.md) and the
  [estimation](https://github.com/horae-dev/horae/blob/main/docs/ESTIMATION.md).
- [JSON Schemas](https://github.com/horae-dev/horae/tree/main/schemas) and their
  [examples](https://github.com/horae-dev/horae/tree/main/schemas/examples).
- [The walking-skeleton example](https://github.com/horae-dev/horae/tree/main/examples/walking-skeleton).
