# Your first pipeline

This tutorial writes a small pipeline from scratch and takes it through the whole cycle: check,
dry run, run, diff, replay and undo. It uses only the two plugins built into the core, so it
needs no model, no secret and no network. It takes about fifteen minutes.

You will:

1. create an instance;
2. give a source plugin a data file, and see the core refuse it until you approve the path;
3. write a pipeline that turns that data into a note;
4. preview the change, apply it, change the data and preview again;
5. replay a run and undo it.

!!! note "What you need"
    A checkout of [horae-dev/horae](https://github.com/horae-dev/horae) with `uv sync` done
    (see the [Quickstart](quickstart.md#try-it-from-a-checkout)). Run every command from the
    checkout. The output shown here was recorded on a real run; your run ids and dates differ.

## 1. Create an instance

```sh
uv run horae init ~/horae-tutorial
```

`horae init` writes a working example instance into a new directory:

| Path | What it is |
|---|---|
| `horae.yaml` | the instance configuration: time zone, state directory, plugin timeouts |
| `pipelines/daily-fixture.yaml` | the example pipeline |
| `horae.lock` | the two built-in plugins, `fixture-source` and `file-sink`, with the permissions approved for them |
| `plugins/` | the installed plugins |
| `state/` | the SQLite store: runs, journal, cache |
| `vault/` | where `file-sink` writes notes |

Check it:

```console
$ uv run horae doctor -i ~/horae-tutorial
OK: 1 pipeline, 2 plugins, 0 model aliases
```

!!! tip
    Every command takes `-i <instance>`. Set `HORAE_INSTANCE=~/horae-tutorial` (or run from
    inside the directory) to leave it out.

## 2. Some data

The built-in `fixture-source` plugin serves a JSON file: `data` is returned as the source's
output, and `intents` are the changes it proposes. A real source plugin (a calendar, a mailbox)
computes both from what it reads; this one just reads them, so you can see what the core does
with them.

Create a data file that proposes one change: replace a block called `week` in a note.

```sh
mkdir -p ~/horae-tutorial/fixtures
cat > ~/horae-tutorial/fixtures/week.json <<'EOF'
{
  "data": {
    "items": [
      {"id": "w-1", "title": "Renew the library card", "due": "2026-12-01"},
      {"id": "w-2", "title": "Book the train tickets", "due": "2026-12-03"}
    ]
  },
  "intents": [
    {
      "type": "note.replace_owned_block",
      "block": "week",
      "content": "- Renew the library card (due 2026-12-01)\n- Book the train tickets (due 2026-12-03)\n"
    }
  ]
}
EOF
```

The intent has no `path`: a plugin does not choose where a note is written. The pipeline does.

## 3. The pipeline

A pipeline is a YAML file in `pipelines/`. This one has two steps: `collect` calls the source,
`act` names the sink that applies what was proposed.

```sh
cat > ~/horae-tutorial/pipelines/week.yaml <<EOF
name: week
steps:
  - collect:
      - fixture-source.serve: { file: $HOME/horae-tutorial/fixtures/week.json }
  - act:
      - file-sink.write_note: { path: "Weekly/week.assistant.md", mode: replace-owned }
EOF
```

(The heredoc is not quoted, so the shell writes your home directory into the file: `file` must
be an absolute path.)

- `fixture-source.serve` is a tool ref, `<plugin>.<tool>`, with its parameters.
- The `act` entry binds the target. `path` is the note the intent will change, and
  `mode: replace-owned` says this entry takes `note.replace_owned_block` intents. The core
  routes each intent to the one entry that takes it, and fills its `path` from that entry.
- The note name ends in `.assistant.md`: Horae creates and owns only such notes. In any other
  note it may only change a block between its own `<!-- horae:begin ... -->` markers.

```console
$ uv run horae doctor -i ~/horae-tutorial
OK: 2 pipelines, 2 plugins, 0 model aliases
```

## 4. A dry run, refused

A dry run executes the steps and shows the changes, and applies none of them:

```console
$ uv run horae run week -i ~/horae-tutorial --dry-run
dry run 20261125T210000817573Z-week-88c8d1: failed
  error: step 0 (collect): fixture-source.serve: tool_error: 'fixture-source.serve: Error executing tool fixture-source.serve: file is not inside a paths.read entry approved in horae.lock' (source_failed)
Nothing to apply: a failed run is never applied (run_failed).
horae run: run_failed
```

The plugin may only read paths that `horae.lock` approves for it, and `horae init` approved
none. The core sends the approved paths with every call, and the plugin refuses anything else.
A failed run is recorded but never applied.

## 5. Approve the path

Open `~/horae-tutorial/horae.lock` and add the fixtures directory to `fixture-source`'s
`paths.read` (use your own absolute path):

```yaml hl_lines="7"
plugins:
  fixture-source:
    permissions:
      intents:
      - note.replace_owned_block
      paths:
        read: [/home/you/horae-tutorial/fixtures]
        write: []
```

You edit the lock by hand here because the built-in plugins have no marketplace entry. For a
plugin from a marketplace, `horae plugin add` shows the permissions and writes the lock when you
approve them, and `--allow-read-path PATH` grants a path the manifest does not ask for (see
[Marketplace and the lock](../concepts/marketplace.md)).

Run the dry run again:

```console
$ uv run horae run week -i ~/horae-tutorial --dry-run
dry run 20261125T210013061461Z-week-e0ade3: ok

Weekly/week.assistant.md: create (intent 0, file-sink.write_note)
--- /dev/null
+++ b/Weekly/week.assistant.md
@@ -0,0 +1,4 @@
+<!-- horae:begin week -->
+- Renew the library card (due 2026-12-01)
+- Book the train tickets (due 2026-12-03)
+<!-- horae:end week -->
```

The core computed the exact bytes of the note: the block, its markers, the file to create. This
is what the sink will write, nothing more. `vault/` is still empty.

## 6. Run it

```console
$ uv run horae run week -i ~/horae-tutorial
run 20261125T210017134900Z-week-842dac: ok
  changed Weekly/week.assistant.md

$ cat ~/horae-tutorial/vault/Weekly/week.assistant.md
<!-- horae:begin week -->
- Renew the library card (due 2026-12-01)
- Book the train tickets (due 2026-12-03)
<!-- horae:end week -->

$ uv run horae runs -i ~/horae-tutorial
RUN                                 PIPELINE  STATUS            STARTED               DURATION  COST     TOKENS IN/OUT  ERROR
20261125T210017134900Z-week-842dac  week      ok                2026-11-25T21:00:17Z  0.7s      $0.0000  0/0
20261125T210013061461Z-week-e0ade3  week      ok (dry run)      2026-11-25T21:00:13Z  0.7s      $0.0000  0/0
20261125T210000817573Z-week-88c8d1  week      failed (dry run)  2026-11-25T21:00:00Z  1.1s      $0.0000  0/0            step 0 (collect): fixture-source.serve: tool_error: 'fixtur…
```

Every run is recorded, dry or not, with its status, duration and model cost (zero here: this
pipeline has no `llm` step).

## 7. Change the data, read the diff

Add a third item to `fixtures/week.json`, in `data.items` and in the intent's `content`:

```json
      "content": "- Renew the library card (due 2026-12-01)\n- Book the train tickets (due 2026-12-03)\n- Call the plumber (due 2026-12-04)\n"
```

The dry run now shows a modification of the existing note:

```console
$ uv run horae run week -i ~/horae-tutorial --dry-run
dry run 20261125T210028867295Z-week-02fc3f: ok

Weekly/week.assistant.md: modify (intent 0, file-sink.write_note)
--- a/Weekly/week.assistant.md
+++ b/Weekly/week.assistant.md
@@ -1,4 +1,5 @@
 <!-- horae:begin week -->
 - Renew the library card (due 2026-12-01)
 - Book the train tickets (due 2026-12-03)
+- Call the plumber (due 2026-12-04)
 <!-- horae:end week -->
```

A dry run is stored. `horae diff <run-id>` shows it again later, against the vault as it is
then:

```console
$ uv run horae diff 20261125T210028867295Z-week-02fc3f -i ~/horae-tutorial
Run 20261125T210028867295Z-week-02fc3f (week, ok, dry run)

Weekly/week.assistant.md: modify (intent 0, file-sink.write_note)
...
```

Apply it:

```console
$ uv run horae run week -i ~/horae-tutorial
run 20261125T210042044161Z-week-5662cb: ok
  changed Weekly/week.assistant.md
```

## 8. Replay

A run records its inputs and every plugin's output. `horae replay` executes the pipeline again
from that record and compares what it proposes:

```console
$ uv run horae replay 20261125T210042044161Z-week-5662cb -i ~/horae-tutorial
run 20261125T210042044161Z-week-5662cb (week): identical: the replay proposes the same intents
```

A replay that differs exits with code 4. With an `llm` step, the replay answers from the
recorded model responses, so it costs nothing.

## 9. Undo

`horae undo` restores every note a run changed, byte for byte:

```console
$ uv run horae undo 20261125T210042044161Z-week-5662cb -i ~/horae-tutorial
Run 20261125T210042044161Z-week-5662cb (week): undone
  Weekly/week.assistant.md: restored
The run is now marked undone.
```

The note is back to two items. Undo refuses to overwrite your work: if the note changed since
the run, nothing is restored. Try it on the first run, after adding a line of your own:

```console
$ echo "my own line" >> ~/horae-tutorial/vault/Weekly/week.assistant.md
$ uv run horae undo 20261125T210017134900Z-week-842dac -i ~/horae-tutorial
Run 20261125T210017134900Z-week-842dac (week): ok
Refused (changed): 1 note (Weekly/week.assistant.md) changed since the run; use --force
  Weekly/week.assistant.md: changed since the run (not restored; --force restores it)
```

The exit code is 4. Remove your line and undo again: this time the run created the note, so
undo removes it.

```console
$ uv run horae undo 20261125T210017134900Z-week-842dac -i ~/horae-tutorial
Run 20261125T210017134900Z-week-842dac (week): undone
  Weekly/week.assistant.md: removed (the run created it)
The run is now marked undone.
```

`--force` restores the note anyway (the bytes it overwrites stay in the journal). Notifications
and HTTP calls cannot be undone: undo lists them instead.

## 10. Put it on a schedule

Add a `trigger` to the pipeline: five cron fields, in the instance's time zone (`timezone` in
`horae.yaml`) unless the trigger sets its own.

```yaml hl_lines="2"
name: week
trigger: { cron: "0 7 * * 1" }       # Mondays at 07:00
steps:
  - collect:
      - fixture-source.serve: { file: /home/you/horae-tutorial/fixtures/week.json }
  - act:
      - file-sink.write_note: { path: "Weekly/week.assistant.md", mode: replace-owned }
```

`horae serve -i ~/horae-tutorial` runs the built-in scheduler (and the read-only HTTP API on
`127.0.0.1:8080`) until you stop it. It reads the instance once at start: restart it after a
change. A fire time missed while it was stopped is not caught up. To use cron, systemd or
Coolify instead, set `scheduler.mode: external` and have them call `horae run week`.

## What you have seen

- The control flow is the YAML file. Nothing chose a step or a tool.
- The plugin proposed a change; the core decided where it goes, computed the bytes, showed
  them, wrote them through the sink and journalled them.
- The plugin could read only what the lock approved.
- Every run is recorded, replayable and undoable.

## Next

- Add a model: an `llm` step with a skill, a model alias and a budget.
  [The LLM step](../concepts/llm-step.md).
- Use real sources and sinks: [Plugins](../plugins/index.md). The
  [daily brief pack](../plugins/pack-daily-brief.md) is a complete pipeline with an `llm` step.
- Learn the step kinds and the template variables (`{{date}}`, `{{now}}`, `{{timezone}}`):
  [Pipelines and steps](../concepts/pipelines.md).
