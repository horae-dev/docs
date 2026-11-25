# The LLM step

A pipeline may have one `llm` step. It is a typed function, not an agent: the core sends the
model a prompt and a view of the collected data, and gets back JSON that must match a schema.
The model has **no tools**. It cannot call a plugin, choose a step, or pick where anything is
written ([ADR 0001](https://github.com/horae-dev/horae/blob/main/docs/adr/0001-pipelines-not-agent-loops.md)).

```yaml
- llm:
    skill: daily-brief/rank-and-word      # the prompt and the output schema
    model: default                        # an alias resolved in horae.yaml
    budget: { usd: 0.15, tokens_out: 4000 }
    on_unchanged_input: skip              # the default: same input, no call
    skip_when_empty: ["[].data.needs_interpretation"]   # optional
    timeout_s: 120                        # optional; the core's default otherwise
```

| Key | Required | Meaning |
|---|---|---|
| `skill` | yes | `<namespace>/<skill>`, shipped by a plugin or a pipeline pack |
| `model` | yes | a model alias from `horae.yaml` |
| `budget` | yes | `usd` and `tokens_out`, both required: the ceiling for this step |
| `on_unchanged_input` | no | `skip` is the only value and the default |
| `skip_when_empty` | no | `true`, or a list of input view paths: no call when they are all empty |
| `timeout_s` | no | seconds |

## Skills

A **skill** is what the step runs: a prompt, the part of the input the model may see, and the
shape of the answer. It lives in a plugin or a pack under `skills/<namespace>/<skill>/`:

| File | What it is |
|---|---|
| `skill.yaml` | the name, version, input view, link policy and the intents the answer may propose |
| `prompt.md` | the prompt, sent verbatim |
| `output.schema.json` | the JSON Schema the answer must match |
| `evals/` | golden cases and their recorded answers |

The **input view** is everything the model sees. The `collect` output is a list of
`{source, params, data}`, and the view keeps only the paths it names, for example
`"[].data.tasks[].description"`. A field the view does not select is never sent: the daily
brief's skill sends task descriptions, due dates and event titles, and not links, note paths or
event locations.

The answer is data. The core validates it against the output schema, with **one repair retry**.
An answer that still fails is never applied, and the step is `degraded`.

## Model aliases and backends

A pipeline names an alias, never a provider. Aliases live under `models:` in `horae.yaml`:

```yaml
models:
  default:
    backend: anthropic
    model: <a Claude model id>
    secret: ANTHROPIC_API_KEY
    price: { input_per_mtok: 3, output_per_mtok: 15 }   # the prices you pay, US$ per million tokens
  personal: { backend: claude-cli, model: sonnet, price: { input_per_mtok: 3, output_per_mtok: 15 } }
  router:
    backend: openai-compatible
    model: mistral-small
    base_url: https://openrouter.ai/api/v1
    secret: OPENROUTER_API_KEY
  local: { backend: ollama, model: llama3, base_url: "http://ollama:11434" }
```

| Backend | What it calls | Needs |
|---|---|---|
| `anthropic` | the Anthropic API | `secret` (the API key) |
| `claude-cli` | your own installed Claude Code, `claude -p --output-format json`, isolated: empty config, built-in tools disabled, an environment allow-list | a `price` (its cost is known only after the call); optionally `command`, the absolute path of `claude` |
| `openai-compatible` | `<base_url>/chat/completions` (OpenRouter, Mistral, vLLM...) | `base_url` with its `/v1`; `secret` if the server wants one; `structured_output: json_object` or `none` for a server without JSON Schema support |
| `ollama` | `<base_url>/api/chat` | `base_url` |

`http://` endpoints are accepted only for loopback and private addresses. `local: true` marks an
alias that runs on the host or the LAN; unset, `ollama` is local and every other backend is a
cloud service.

!!! warning "`claude-cli` is for personal use under your plan's terms"
    Horae never handles OAuth. The `claude-cli` backend runs **your** installed, logged-in Claude
    Code (or a `CLAUDE_CODE_OAUTH_TOKEN` you created with `claude setup-token`), as personal use
    under your plan's terms. The documented default is `anthropic` with an API key
    ([ADR 0005](https://github.com/horae-dev/horae/blob/main/docs/adr/0005-claude-cli-backend-and-its-terms.md)).
    The policy is to be re-checked before v0.1.

## Cost: budgets, cache and the ledger

Budget per step
:   `budget.usd` and `budget.tokens_out`. Before each call, the core checks the call can afford
    it and sizes `max_tokens` from what is left. Without a `price` on the alias a call is
    recorded at `usd: 0` and only `tokens_out` bounds the step (`horae doctor` warns about a
    cloud alias without one).

Budget per day
:   `budgets.daily` in `horae.yaml` (`usd`, `tokens_out` or both), and per pipeline under
    `budgets.pipelines.<name>.daily`, in the instance's time zone. The day's allowance is reserved
    before each call, so two concurrent runs cannot jointly overspend it. A dry run's model calls
    count too.

The cache, or the $0 path
:   Accepted answers are cached on the skill version, the model and the normalized input. A run
    whose input is unchanged makes **no call** and reuses the answer (`cache.ttl_s`, 7 days by
    default; `cache.max_entries`, 1000). `horae run --no-cache` asks the model anyway, and
    `horae cache purge` forgets cached answers.

Skip when empty
:   With `skip_when_empty`, a step whose viewed input is empty makes no call and creates no cache
    entry; it is recorded as `skipped`. The Gmail triage uses it so that a batch your rules
    decided entirely costs nothing.

The ledger
:   Every call, cached or not, is recorded with its tokens and cost. `horae usage` shows them per
    pipeline and day, with totals.

## Untrusted text

Everything a plugin collects is **untrusted**: a mail subject, an invitation, a pull request
title. It can fill fields of the answer; it cannot choose an action, a recipient or a URL.

- The model has no tools, and every target (a note path, a URL, a task link prefix) comes from a
  trusted parameter of the pipeline, not from the answer.
- The **action guard** checks the answer's text before anything is proposed: every URL in it
  must be an exact string of the viewed input, no image, embed or script link is accepted, and a
  skill's per-type limits hold. In note text it also refuses Obsidian Tasks checkboxes and
  signifiers, wikilinks, `::`, `%%`, `#tags` and Horae's block markers. A skill may set
  `links: none` to refuse every link. A violation degrades the whole step.

## De-identification

Before a **cloud** alias, the core can replace names with pseudonyms and put the real values
back in the answer:

- `deidentification.vocabulary` in `horae.yaml` names a file in the secrets directory, one
  `class: term` per line (`person`, `email`, `phone` or `place`). Every string of the viewed
  input is scanned for those terms.
- A plugin can declare **personal fields** of its output (`provides.personal_fields` in its
  manifest; the school plugin declares the children's first names and the teachers). The core
  pseudonymizes them whatever the skill declares.
- A local alias (`ollama`, or `local: true`) is sent the data unchanged, by design.

Limits: nicknames, initials, typos and names of fewer than three letters are not matched.

## Golden cases

`horae eval <namespace>/<skill>` runs a skill's golden cases offline: each case is a recorded
input and a recorded answer, checked through the real renderer, validator and action guard. No
network, no secret, no cost. With `--live --max-usd <cap>` it sends the cases to a real model
under a spend cap, and `--record` writes the answers that pass.

## Read more

- [Schemas and decisions](../reference/schemas.md): decisions 38 to 48 cover the backends,
  budgets, cache, guard and de-identification.
- [Writing a plugin](../plugins/writing-a-plugin.md): shipping a skill.
- The design note on the [`claude-cli` backend](https://github.com/horae-dev/horae/blob/main/docs/design/0029-claude-cli-backend.md).
