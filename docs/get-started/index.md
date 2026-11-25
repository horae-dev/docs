# Get started

Horae runs pipelines you declare in YAML: it collects data through plugins, asks a model for
one bounded answer if the pipeline has an `llm` step, and applies the changes the pipeline
proposes, with a diff you can read first and a journal you can undo. It is one process, one
SQLite file and a folder of YAML.

!!! warning "Pre-release"
    Nothing is published yet: there is no release of the core on PyPI and no tagged image.
    Horae runs from a checkout of [horae-dev/horae](https://github.com/horae-dev/horae) or from
    an image you build or pull from its `main` branch. The design decisions are provisional
    until the maintainer accepts them. Anything a page calls "planned" is not on `main`.

## Pick your path

| You want to | Go to |
|---|---|
| Understand what Horae is for, and what it is not | [Why Horae](why.md) |
| **Try it**: run the example pipeline from a checkout, no Docker, no secret, no network | [Quickstart](quickstart.md) |
| **Run it**: Docker Compose, the container image or Coolify | [Install with Docker](install.md) |
| **Extend it**: write a pipeline of your own, dry-run it, apply it, undo it | [Your first pipeline](first-pipeline.md) |
| Write a plugin | [Writing a plugin](../plugins/writing-a-plugin.md) |
| Watch a narrated tour first | [Video tour](videos.md) |

## The vocabulary in one screen

Instance
:   A directory with `horae.yaml`, a `pipelines/` folder, a `horae.lock` file and a state
    directory. Every command takes `-i <dir>` to name it.

Pipeline
:   A YAML file: a name, an optional cron `trigger`, and steps (`collect`, `transform`, `llm`,
    `act`, `notify`) run in order. See [Pipelines and steps](../concepts/pipelines.md).

Plugin
:   An MCP server the core starts for a run. It returns data and proposes changes; it never
    writes anything itself. See [Plugins and permissions](../concepts/plugins.md).

Intent
:   A proposed change from a closed set (`note.create`, `task.create`, `notify.push`...). The
    core checks it, shows it in a dry run, journals it and applies it through a sink. See
    [Intents, dry-run and undo](../concepts/intents.md).

The lock
:   `horae.lock` pins each plugin to a commit and records the permissions you approved. See
    [Marketplace and the lock](../concepts/marketplace.md).
