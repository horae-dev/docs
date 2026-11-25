# Intents, dry-run and undo

Plugins and the model never write anything. They return **intents**, typed requests for a
change, and the core is the only thing that applies them. That one choke point is what makes a
dry run trustworthy, a journal complete and an undo possible
([ADR 0002](https://github.com/horae-dev/horae/blob/main/docs/adr/0002-intents-applied-by-the-core.md)).

## The closed set

| Intent | What it asks for | Fields |
|---|---|---|
| `note.create` | create a note | `path`, `content` |
| `note.append_section` | append a section under a heading | `path`, `heading`, `content` |
| `note.replace_owned_block` | replace the content of a block Horae owns | `path`, `block`, `content` |
| `task.create` | create a task | `title`, `fingerprint`, optional `due`, `time`, `link` |
| `task.update_status` | change a task's status: `done`, `cancelled`, `todo`, `snoozed` | `task`, `status`, optional `until` |
| `notify.push` | send a notification | `body`, optional `title`, `link`, `actions`, `key` |
| `http.post` | post to a declared host | `url`, `body` |

Each has a JSON Schema in [`schemas/intents/`](https://github.com/horae-dev/horae/tree/main/schemas/intents).
The set is closed on purpose: the core can validate, diff and journal only what it understands,
so a plugin cannot add a kind of write.

## From proposal to change

For every intent of a run, the core:

1. **validates** it against its schema (safe note paths, `https`-only URLs, one-line titles,
   size limits);
2. **checks** it against the proposing plugin's approved `permissions.intents`: a plugin may
   only propose the intents it declared and you approved;
3. **guards** it, if the model proposed it (see [the action guard](llm-step.md#untrusted-text));
4. **routes** it to exactly one `act` or `notify` entry of the pipeline, which binds its target:
   the note `path`, the `http.post` `url`, the `link_prefix` a link must fall under. An intent
   that no entry takes, or that two entries could take, fails the run;
5. **plans** it: for a note, the core computes the exact bytes to write;
6. **shows** the plan in a dry run, or **applies** it through the sink and **journals** it.

Untrusted text can fill a title or a body. It never picks a target: every target comes from a
trusted parameter of the pipeline.

## Notes Horae owns

Horae writes only what it owns:

- **Owned notes** end in `.assistant.md`. Only those are created, appended to, or removed by
  undo.
- **Owned blocks** sit between `<!-- horae:begin <block> -->` and `<!-- horae:end <block> -->`.
  In any other note, `note.replace_owned_block` may only change the lines of its one
  well-formed block. Duplicated, nested or malformed markers are refused.
- **Task lines** are the exception: `task.update_status` changes the single line of one task, in
  any note, under compare-and-swap on the note and the line (the Obsidian sink does this).

Every write is a **compare-and-swap**: the sink writes the bytes the core planned only if the
note still has the content the core saw, else the change fails with `target_changed` and nothing
is written.

## Dry run

```sh
horae run <pipeline> --dry-run
```

A dry run executes every step, plans every intent and prints the diff. It writes **nothing** to
your vault, sends no notification and makes no remote write. Horae's own state is still written
(the run record and the usage ledger), and a dry run's model calls count against the daily
budgets.

A stored dry run can be shown again with `horae diff <run-id>`, planned against the vault as it
is then.

## The journal and undo

Every applied change is journalled per run with the bytes before and after. `horae undo
<run-id>`:

- restores every note the run changed, byte for byte, and removes the notes it created;
- puts a task status change back through the sink that made it;
- **refuses** when a note changed since the run, or a later run changed it too (exit code 4).
  `--force` restores it anyway; the bytes it overwrites stay in the journal. `--force` never
  lifts the compare-and-swap, the path rules or the check that the sink is the same vault;
- **lists** what cannot be undone: created tasks, sent notifications and HTTP calls reach the
  outside world.

Undo is not a transaction. If it stops half-way, its report says what was restored (it stays
restored) and what was not; running it again continues where it stopped.

## Replay

A run records its inputs, each plugin's output and version, and the model's request and
answer. `horae replay <run-id>` re-executes the pipeline from that record and compares the
intents it proposes: `identical` (exit 0) or different (exit 4). Model answers come from the
record, so a replay costs nothing.

## Notifications and action links

A `notify.push` can carry up to three buttons (`Done`, `Snooze 1h`, `Snooze 3h`, `Tomorrow`) for
open tasks the run collected. The core mints a signed, single-use link for each, valid 24 hours
and bound to the task's current state; one tap applies the change through the instance's
`mode: tasks` sink, as a run of the reserved pipeline `_act`. This needs the `HORAE_ACT_KEY`
secret and `http.public_url` in `horae.yaml`; without the key, notifications are sent without
buttons. Details: [runtime reference](../reference/runtime.md#getting-started) and the design
note on [action links](https://github.com/horae-dev/horae/blob/main/docs/design/0038-act-links.md).

A notification with a `key` is sent once per key, however many runs propose it.

## Read more

- [Your first pipeline](../get-started/first-pipeline.md): a dry run, a diff, a replay and an
  undo, step by step.
- [Schemas and decisions](../reference/schemas.md#strings-that-reach-the-outside-world): what
  the contracts constrain.
- [Threat model](../security/threat-model.md): what this design defends against, and what it
  does not.
