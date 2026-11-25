# Obsidian vault

Reads and writes an Obsidian vault in Obsidian Tasks syntax, touching only what Horae owns. It
reads open tasks as a source, writes notes and task status changes as sinks, and provides two
deterministic transforms: the reminders of the [reminders pack](pack-reminders.md) and a layout
for a daily note. The core computes every note's bytes; the plugin writes exactly those bytes,
under compare-and-swap.

!!! note "Status"
    Version 0.2.1, listed in the marketplace. The Tasks parser, the note sink, the
    `obsidian.open_tasks` source, the task sink and both transforms are in. Not supported yet:
    the Tasks global filter and Dataview inline fields.

## What it reads and writes

| Tool | Kind | What it does |
|---|---|---|
| `obsidian.open_tasks` | source | scans the vault and returns the open tasks by due date, with their key, dates, reminder, snooze, tags and priority; writes nothing |
| `obsidian.reminders` | transform | turns open tasks into `notify.push` reminders, a digest and overdue nudges; no clock, no network |
| `obsidian.render_note` | transform | lays out a daily note (alerts, calendar, tasks by due date, GitHub items) as one owned block; untrusted text made inert |
| `obsidian.write_note` | sink | applies `note.create`, `note.append_section`, `note.replace_owned_block` |
| `obsidian.write_task` | sink (`mode: tasks`) | applies `task.create` (appended to its owned `Tasks.assistant.md`) and `task.update_status` (one line of one task, in any note) |

What it owns:

- **Notes** whose name ends in `.assistant.md`: only those are created, appended to, or removed
  by undo.
- **Blocks** between `<!-- horae:begin <block> -->` and `<!-- horae:end <block> -->` in any other
  note: only the lines of its one well-formed block may change.
- **One task line** for a status change: `done` sets `[x]` and `✅ <date>`, `cancelled` `[-]` and
  `❌ <date>`, `snoozed` writes a `⏰` reminder. Nothing else in the note changes. A recurring
  task is left for you to tick in Obsidian.

Every write is a compare-and-swap on the bytes the core planned, then an atomic rename. A
symbolic link anywhere below the vault is never followed. `horae undo` puts every changed note
back, and refuses if you edited it since (unless `--force`).

## Permissions

From `plugin.yaml`:

| Kind | Value | Why |
|---|---|---|
| intents | `note.create`, `note.append_section`, `note.replace_owned_block` | the note sink |
| intents | `task.create`, `task.update_status` | the task sink |
| intents | `notify.push` | proposed by `obsidian.reminders` (a notifier applies it) |
| network | none | |
| secrets | none | |
| paths | none in the manifest | **the vault**, granted at install as the single `paths.write` entry |

## Install

```sh
horae plugin add obsidian@0.2.1 --allow-path /srv/horae/vault
```

The vault is an absolute path, and the plugin takes exactly one. It keeps a small index of the
tasks it created in `.horae/obsidian-tasks.json` inside the vault (a hidden folder the scan skips).
To keep the vault in sync with your devices, see [LiveSync](livesync.md).

## Example

```yaml
steps:
  - collect:
      - obsidian.open_tasks: { limit: 500 }
  - transform:
      - obsidian.render_note:
          today: "{{date}}"
          timezone: "{{timezone}}"
          block: assistant-daily
  - act:
      - obsidian.write_note: { path: "Daily/{{date}}.assistant.md", mode: replace-owned }
```

`obsidian.render_note` groups tasks by due date (Overdue, Today, Tomorrow, Later, No date) and
gives the same bytes for the same input. Its `template` parameter overrides the layout with
`${date}`, `${summary}`, `${focus}`, `${alerts}`, `${calendar}`, `${tasks}` and `${github}`
placeholders; it is read from the pipeline, never from the vault. See the GitHub plugin's
[examples](github.md#example-pipelines) for it combined with other sources.

## Repository

[horae-dev/plugin-obsidian](https://github.com/horae-dev/plugin-obsidian): task identity and
fingerprints, the parser's bounds, every refusal kind, the reminder rules.
