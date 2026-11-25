# Why Horae

Horae is for one job: read your sources at a fixed hour, tell you what needs doing, and write
the result where you keep your notes. The goal of the project, in the words of its
[plan](https://github.com/horae-dev/horae/blob/main/docs/PLAN.md#1-why-horae-the-gap), is an
assistant you can trust "the way I trust a cron job".

That goal rules out the design most personal agents use today, and this page explains why.

## Pipelines, not agent loops

A common way to build a personal agent is a loop: the model gets a goal and a set of tools,
decides which tool to call, reads the result, decides again, and stops when it thinks it is
done. That design is flexible. It is also hard to predict: the same morning can produce a
different sequence of calls, every run is a conversation that costs tokens, and a sentence in
an e-mail can change what the model decides to do next.

Horae inverts the roles ([ADR 0001](https://github.com/horae-dev/horae/blob/main/docs/adr/0001-pipelines-not-agent-loops.md)):

- **You declare the control flow.** A pipeline is a YAML file whose steps run in order:
  `collect → transform → llm → act → notify`. Each step names the plugin calls it makes. No
  model chooses a tool or a step.
- **The model is a function, not a planner.** A pipeline has at most one `llm` step. It gets a
  skill (a prompt and an output JSON Schema), a model alias, a budget and a timeout, and **no
  tools**. Its answer is data that must validate against the schema; an answer that does not,
  after one repair retry, is never applied.
- **Plugins propose; the core applies.** No plugin and no model writes anything. They return
  *intents* from a closed set; the core checks them against the permissions you approved,
  shows the diff, journals the change and applies it through a sink
  ([ADR 0002](https://github.com/horae-dev/horae/blob/main/docs/adr/0002-intents-applied-by-the-core.md)).

## What this buys you

Predictability
:   The same pipeline and the same inputs give the same calls. A run records its inputs, the
    plugin versions and the model's request and answer, so `horae replay <run>` re-executes it
    from the record and says whether it proposes the same changes.

A bounded cost
:   Each `llm` step has a budget in US dollars and output tokens, and the instance can set a
    daily ceiling. When the input is the same as last time, the step makes **no call at all**
    (`on_unchanged_input: skip`, the default): an unchanged morning costs nothing. A pipeline
    with no `llm` step, such as a reminder that runs every five minutes, never calls a model.

Changes you can read and take back
:   `horae run --dry-run` shows the diff and writes nothing to your vault, your notifications
    or any remote service. `horae undo <run>` restores every note the run changed, byte for
    byte, and refuses if you edited the note since.

Untrusted text stays data
:   Mail, calendar invitations, issue titles and note text are written by other people. In
    Horae they can fill fields of an answer; they cannot choose an action, a recipient or a URL
    that the pipeline did not already allow, because the model has no tools and every target
    is bound to a trusted parameter of the pipeline.

Plugins with declared limits
:   Each plugin declares the hosts, secrets, paths and intents it uses. You approve them at
    install; `horae.lock` pins the plugin to a commit with those permissions; a plugin that
    asks for more on upgrade needs your approval again. With `runtime: container`, a plugin
    runs in its own container whose only way out is an allow-list proxy built from those
    hosts. See [Plugins and permissions](../concepts/plugins.md).

Your model
:   The Anthropic API, your own `claude -p`, any OpenAI-compatible endpoint, or Ollama, behind
    aliases you name in `horae.yaml`. See [The LLM step](../concepts/llm-step.md).

## What it costs you

The same choices have a price. Read this before you decide.

- **Horae is not a chat agent.** It does not answer questions, browse, or explore. Open-ended
  tasks do not fit a declared pipeline; that is an explicit non-goal.
- **A new behaviour is a new pipeline**, or an edited one, not a new prompt.
- **One `llm` step per pipeline** limits what one run can reason about to what one skill can
  do.
- **The set of intents is closed.** A new kind of write needs a new intent type in the core;
  a plugin cannot add one.
- **Some things cannot be undone.** A sent notification or an `http.post` reaches the outside
  world; `undo` restores files and task lines, and lists the rest.
- **It is early.** Horae is pre-release, built in the open by AI agents under a maintainer's
  review, and its decisions are provisional. See the [roadmap](../project/roadmap.md).

## How it compares

The plan compares Horae with three families of tools. Each makes a different trade-off, and
each is the better choice for some jobs.

| | Agent loops with tools | Workflow engines | Agent graph libraries | Horae |
|---|---|---|---|---|
| Who decides the actions | the model, in a loop | the workflow | your code (a graph) | the pipeline definition |
| What the model is | a planner with tools | a node | a node | a typed function, schema in and out, no tools |
| Cost when nothing changed | each run is a conversation | low | your choice | no model call (input hashing) |
| Plugin trust | varies with the skill or tool source | community nodes | Python packages | declared permissions, approved and pinned to a commit |
| Testing | hard | medium | good | replay from records, golden cases, dry-run diff |
| Undo | no | partial | you build it | a journal of every write, `horae undo` |

Choose an agent loop when you want a conversation, or a task whose steps you cannot write
down in advance. Choose a workflow engine when you need many integrations, a visual editor or
a team. Choose a graph library when you are writing an application and want the flow in code.
Choose Horae when you want the same small job done every day, with a cost you can bound and
changes you can read and undo.

## Next

- [Quickstart](quickstart.md): run the example pipeline in a minute.
- [Concepts](../concepts/index.md): the vocabulary in more depth.
