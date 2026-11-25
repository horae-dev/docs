# Security

Horae reads untrusted text (mail, invitations, issue titles, notes) and writes to things you
care about (your vault, your phone, remote services). Its security rests on a few design
choices, and on a threat model that names, for every threat, the control, the test that pins
it and whether it is implemented, planned or an accepted risk.

## The promise

- **Control flow is declared**, never chosen by a model; the `llm` step has no tools.
- **Plugins and the model never write.** They propose intents from a closed set, which the core
  validates, diffs, journals and applies through a sink.
- **A plugin gets only what you approved**: hosts, secrets, paths and intents, pinned with its
  commit in `horae.lock`.
- **Untrusted content stays data**: it can fill fields, never choose an action, a recipient or a
  URL that was not already in the input set.

## Two tiers of enforcement

| Tier | Runtime | What it constrains |
|---|---|---|
| **Declared** | `runtime: process` (default) | what a plugin can make the core do: its secrets, its approved hosts and paths sent with each call, its intents checked. Not what the process itself can do: for first-party plugins only |
| **Isolated** | `runtime: container` | the plugin process too: its own container, non-root, read-only, no capability, only approved paths mounted, no network but an allow-list egress proxy. Required for every plugin that is not first-party |

## Pages

| Page | What it covers |
|---|---|
| [Threat model](threat-model.md) | assets, trust boundaries, attacker models, every threat with its control and test, accepted risks |
| [Plugin containers and egress](plugin-containers.md) | `runtime: container`: what a plugin container is, the egress proxy, declared mounts, limits, Horae inside Docker, measured latency |

## Reporting a vulnerability

**Do not open a public issue.** Use GitHub's private vulnerability reporting on
[horae-dev/horae](https://github.com/horae-dev/horae/security): **Security**, then **Report a
vulnerability**. The policy is the organisation's
[`SECURITY.md`](https://github.com/horae-dev/.github/blob/main/SECURITY.md).

!!! warning "Pre-release"
    Horae's decisions are provisional. Its security-sensitive stories are human-led (an agent
    drafts, the maintainer designs and reviews; see [Contributing](../project/contributing.md)),
    and the malicious-plugin suite runs in CI. Read the [accepted risks](threat-model.md#7-accepted-risks)
    before you run it on a host that holds anything else of value.
