# Pipelines and steps

A pipeline is the unit of work in Horae: one YAML file in the instance's `pipelines/` folder
that says what to read, what to ask a model, what to change and whom to tell. The core runs its
steps in order. There is no loop, no planner and no tool chosen by a model
([ADR 0001](https://github.com/horae-dev/horae/blob/main/docs/adr/0001-pipelines-not-agent-loops.md)).

## The file

```yaml
# pipelines/daily-brief.yaml (from the daily-brief pack, shortened)
name: daily-brief
trigger: { cron: "30 5 * * *" }
steps:
  - collect:
      - calendar.events: { start: "{{date}}", days: 2, timezone: "{{timezone}}", partial: true }
      - obsidian.open_tasks: { limit: 100 }
  - llm:
      skill: daily-brief/rank-and-word
      model: default
      budget: { usd: 0.15, tokens_out: 4000 }
      on_unchanged_input: skip
  - act:
      - obsidian.write_note: { path: "Daily/{{date}}.assistant.md", mode: replace-owned }
```

| Key | Required | Meaning |
|---|---|---|
| `name` | yes | the pipeline's name: `horae run <name>` |
| `trigger` | no | `{cron: "<five fields>", timezone: <IANA zone>}`; without `timezone`, the instance's. No `@daily` macros. Without a trigger, the pipeline runs only when called |
| `steps` | yes | the list of steps; each step is an object with exactly one key, its kind |

The contract is [`schemas/pipeline/v1.json`](https://github.com/horae-dev/horae/blob/main/schemas/pipeline/v1.json);
unknown keys are rejected. `horae doctor` loads every pipeline of the instance and reports what
does not validate.

## The five step kinds

| Step | What it does | Who runs the code |
|---|---|---|
| `collect` | reads data from sources (a calendar, a mailbox, a vault, an API) | a plugin |
| `transform` | normalizes, filters or lays out the data, deterministically | a plugin |
| `llm` | one bounded model call: a skill, a model alias, a budget; **no tools** | the core |
| `act` | applies the intents proposed so far, through sinks | the core and a sink plugin |
| `notify` | sends the `notify.push` intents through a notifier | the core and a notifier plugin |

A pipeline has **at most one** `llm` step. Many have none: the `remind` pipeline of the
[reminders pack](../plugins/pack-reminders.md) runs every five minutes and never calls a model.

### Plugin calls

`collect`, `transform`, `act` and `notify` list plugin calls. A call is a tool ref,
`<plugin>.<tool>`, in one of three forms:

```yaml
- collect:
    - livesync.status                                   # no parameters
    - calendar.events: { start: "{{date}}", days: 2 }   # with parameters
    - { tool: github.updates, params: { today: "{{date}}" }, timeout_s: 60 }   # with its own timeout
```

The calls of one `collect` step run concurrently (at most eight at a time); the others run in
order. Without `timeout_s`, a call gets the plugin's `call_timeout_s` from `horae.yaml` (else
`plugin_defaults.call_timeout_s`).

### `act` and `notify` entries bind the targets

An `act` entry names a sink and the trusted parameters that bind where a change goes. Its `mode`
says which intents it takes:

| `mode` | Intents it takes | Target parameter |
|---|---|---|
| `create` | `note.create` | `path` |
| `append-section` | `note.append_section` | `path` |
| `replace-owned` | `note.replace_owned_block` | `path` |
| `tasks` | `task.create`, `task.update_status` | `link_prefix` for linked tasks |
| `post` | `http.post` | `url` |

The core routes each proposed intent to the one entry that takes it and fills the target from
that entry: a plugin or a model never chooses the note path or the URL. A `notify` entry takes
`notify.push`; a proposed `link` is routed only to an entry whose `link_prefix` it falls under.
An intent no entry takes fails the run. See [Intents, dry-run and undo](intents.md).

## Template variables

Parameters can use `{{date}}` (the run's day, `YYYY-MM-DD`, in the run's time zone), `{{now}}`
(the run's start, RFC 3339) and `{{timezone}}`, plus any `--var KEY=VALUE` given to `horae run`.
That is the whole language: no filters, no expressions, no loops. An unknown variable is an
error. Step outputs are **never** variables, so data read from outside cannot become a
parameter of a later call. All parameters are rendered once, before the first step, so a
template error fails the run before any plugin is called.

Passing `{{date}}` and `{{now}}` to plugins (instead of letting them read a clock) is what makes
a replay see the same day.

## Runs

Each execution is a **run**, recorded in the instance's SQLite store: the input snapshot, each
step's output, the proposed intents and the applied changes, the model calls and their cost,
and a status.

| Status | Meaning |
|---|---|
| `ok` | every step succeeded |
| `noop` | nothing to do: the input was unchanged and the run records no intent |
| `degraded` | some sources failed but not all, or the `llm` step failed (backend error, timeout, budget, an answer refused by the schema or the action guard) |
| `failed` | every source failed, a transform failed, or an intent was rejected, unroutable or ambiguous; a failed run is never applied |

The run's status is the worst of its steps'. The rule behind it: **a write is never made from
partial or unvalidated data**. After a degraded `collect`, every `act` step is skipped and its
intents dropped, while `notify` still runs (telling you about partial data beats silence). A
degraded `llm` step skips the steps after it.

A run that `horae undo` reversed is shown as `undone`. A dry run is recorded too, marked
`(dry run)`, and never applied.

| Command | What it does |
|---|---|
| `horae run <pipeline> [--dry-run]` | runs the pipeline once; with `--dry-run`, shows the diff and applies nothing |
| `horae runs` | lists runs, newest first, with status, duration and cost |
| `horae diff <run>` | shows what applying a stored run would change |
| `horae replay <run>` | re-executes a run from its record and compares the intents |
| `horae undo <run>` | restores every note the run changed |

A pipeline runs once at a time: a `horae run` of a pipeline that is already running does not
wait, it exits with code 5 (`locked`). SIGINT or SIGTERM stops a run cooperatively; once the apply has
started it finishes, and the record is saved. Exit codes are listed in the
[runtime reference](../reference/runtime.md#getting-started).

## Scheduling

`horae serve` is the long-running process of a container. It fires every pipeline that has a
`trigger`, one run at a time by default (`scheduler.max_concurrent`). A fire time missed while
it was stopped is not caught up; one more than `scheduler.misfire_grace_s` late (one hour by
default), or one that comes while the pipeline is still running, is skipped and logged.

With `scheduler.mode: external` (or `HORAE_SCHEDULER=external`) no trigger fires: Coolify
Scheduled Tasks, cron or a systemd timer call `horae run <pipeline>`. Either way,
`scheduler.monitors.<pipeline>` pings an Uptime Kuma or Healthchecks push URL after each run,
so a missed run shows up in your monitoring.

## Pipeline packs

A **pipeline pack** is a plugin with no runtime that ships pipelines (and often a skill).
`horae plugin add` validates its pipelines and copies them to
`pipelines/<plugin>/<name>.yaml` in the instance; they run only once the pack is listed under
`plugins:` in `horae.yaml`. See [Marketplace and the lock](marketplace.md).

## Read more

- [Your first pipeline](../get-started/first-pipeline.md): a tutorial.
- [Schemas and decisions](../reference/schemas.md): the full contract, decision by decision.
- [Command line](../reference/cli.md): every option of every command.
