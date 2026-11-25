# Daily brief (pack)

The morning note. Every morning the `daily-brief` pipeline reads your calendar, your open
Obsidian tasks and your GitHub work, has **one bounded LLM call** rank and word it, and writes
the result into an owned block of today's assistant note, `Daily/<date>.assistant.md`. The model
never decides what runs or where anything is written: the pipeline fixes the steps and the note's
path, and the model can only propose the content of the one `daily-brief` block.

```markdown
<!-- horae:begin daily-brief -->
Two things are overdue, a conference and three events today, planning tomorrow.

## Now

- Send the insurance form (due Nov 6)
- Work on widgets #42: cache misses on cold start (due Nov 6)
- All day: Product conference (until Nov 10)
- 09:30 Team stand-up
...

## Tomorrow

- All day: School holiday
- 10:00 Quarterly planning
<!-- horae:end daily-brief -->
```

!!! note "Status"
    Version 0.1.1, listed in the marketplace. The pipeline and the skill pass their checks
    against the core's `main`, with stand-ins of the plugins in their real shapes. The wording of
    the note has **not been judged by the maintainer yet**: the golden answers are hand-written,
    not recorded from a model.

## What is in the pack

A pack is a plugin with no runtime: it ships files, not a process.

| File | What it is |
|---|---|
| `pipelines/daily-brief.yaml` | the pipeline: `collect` → `llm` → `act`, cron `30 5 * * *` |
| `skills/daily-brief/rank-and-word/skill.yaml` | the skill: version, input view, `links: none` |
| `skills/daily-brief/rank-and-word/prompt.md` | the prompt, sent verbatim |
| `skills/daily-brief/rank-and-word/output.schema.json` | the output schema: a `summary`, at most 20 `ranked` references, and exactly one `note.replace_owned_block` of block `daily-brief` with at most 2,500 characters |
| `skills/daily-brief/rank-and-word/evals/` | 13 golden cases: 8 synthetic mornings and 5 obeyed prompt injections the guard must refuse |

**What the model sees**: for each source its name, today's date and whether its list is
complete; for tasks the description, dates, priority and `source_fingerprint`; for GitHub items
the repository, number, title, due date and kind; for events the title, start, end, all-day flag
and status. **Not** links, note paths, event locations, descriptions or calendar names.

## Permissions

From `plugin.yaml`:

| Kind | Value |
|---|---|
| network | none |
| secrets | none |
| paths | none |
| intents | `note.replace_owned_block` (the block the skill proposes; the obsidian sink applies it) |

## Install

```sh
horae plugin add pack-daily-brief@0.1.1
```

The pipeline is copied to `pipelines/pack-daily-brief/daily-brief.yaml`. It also needs:

| Entry | Plugin | Needs |
|---|---|---|
| `calendar.events` | [calendar](calendar.md) | secret `CALENDAR_ICS_URLS` (or CalDAV, Google) |
| `obsidian.open_tasks`, `obsidian.write_note`, `obsidian.write_task` | [obsidian](obsidian.md) | the vault, granted with `--allow-path` |
| `github.review_requests`, `github.assigned`, `github.mentions` | [github](github.md) | secret `GITHUB_TOKEN` (fine-grained, read-only) |

A source you do not have must be removed from the pipeline (an unknown tool fails the run before
anything is called); the skill copes with any subset. Then:

```yaml
# horae.yaml
models:
  default:
    backend: anthropic
    model: <a Claude model id>
    secret: ANTHROPIC_API_KEY
    price: { input_per_mtok: 3, output_per_mtok: 15 }   # what you pay; the step budget is checked against it
plugins:
  pack-daily-brief: {}      # the pack's pipelines run only once it is listed here
```

Check with `horae doctor`, look at `horae run daily-brief --dry-run`, then run it.

## The pipeline

```yaml
name: daily-brief
trigger: { cron: "30 5 * * *" }
steps:
  - collect:
      - calendar.events: { start: "{{date}}", days: 2, timezone: "{{timezone}}", partial: true }
      - obsidian.open_tasks: { limit: 100 }
      - github.review_requests:
          { today: "{{date}}", orgs: [Acme-Org], max_items: 20, due_in_business_days: 0 }
      - github.assigned: { today: "{{date}}", orgs: [Acme-Org], max_items: 20, skip_covered: true }
      - github.mentions:
          { today: "{{date}}", orgs: [Acme-Org], max_items: 20, skip_covered: true, due_in_days: 0 }
  - llm:
      skill: daily-brief/rank-and-word
      model: default
      budget: { usd: 0.15, tokens_out: 4000 }
      on_unchanged_input: skip
  - act:
      - obsidian.write_note: { path: "Daily/{{date}}.assistant.md", mode: replace-owned }
      - obsidian.write_task: { mode: tasks, link_prefix: "https://github.com/Acme-Org/" }
```

- **`Acme-Org` is a placeholder**: replace it with your GitHub owner, in its canonical case, in
  the three `orgs` and in `link_prefix`. For several owners, add one tasks entry per owner, with
  prefixes that do not overlap.
- **Unchanged input costs nothing**: a second run on the same data reuses the cached answer.
- **Budget**: at most US$0.15 and 4,000 output tokens per run; each GitHub kind reads at most
  20 items.
- The GitHub sources also propose one `task.create` per item, with its link; `obsidian.write_task`
  appends them to its own `Tasks.assistant.md`. Drop the three `github.*` sources and that entry
  together if you do not use GitHub.

## When there is no note

The note is written only when the whole run succeeds:

- **a source failed** (GitHub rate limited, the vault unreadable, every calendar down): the run is
  `degraded` and nothing is written from partial data. One calendar failing out of several does
  not stop the brief (`partial: true`): the note says the list is incomplete;
- **the model's answer was refused** (the schema, or the action guard): the step is `degraded`;
- **applying failed**: the run `failed` and nothing was applied.

## Repository

[horae-dev/pack-daily-brief](https://github.com/horae-dev/pack-daily-brief): the full design
notes (ranking rules, injection cases, budget tests) and the live-eval workflow run on release
tags.
