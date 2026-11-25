# MCP brief

The bridge to services you already run. `mcp-brief.collect` calls a `brief()` tool on each MCP
service you configure (a personal finance coach, a training log), validates the small JSON
document it returns against the `brief()` contract, and turns it into intents: a section of the
morning note per service, tasks, and a push for each critical alert. A service chooses neither a
note block, a key nor a host, and it never writes to Horae.

!!! note "Status"
    Version 0.1.2, listed in the marketplace. The source and the `brief()` contract (schema v1)
    are in.

## What it reads and writes

| From the brief | Becomes |
|---|---|
| name, headline, status, non-critical alerts, links | `note.replace_owned_block`, block `brief-<id>`: one section per service, rewritten every run |
| each task (at most `max_tasks_per_service`) | `task.create`, fingerprint `<id>:<task id>`, with its link if under a `link_prefix` |
| each `crit` alert (at most `max_pushes_per_service`) | `notify.push`, key `<id>:<alert key>` |

`<id>` is the id **you** configure. A service that cannot be used (unreachable, invalid answer,
clock skew, too large) is **degraded** with a fixed reason: its section reads
`**Unavailable:** <reason>`, and the others still flow. The call never fails the step. No text
from a service, no response body and no token ever reaches a reason or a log.

## Permissions

From `plugin.yaml`:

| Kind | Value | Why |
|---|---|---|
| optional secrets | `MCP_BRIEF_TOKEN_1` to `MCP_BRIEF_TOKEN_8` | a bearer token per service, if it wants one |
| intents | `note.replace_owned_block`, `task.create`, `notify.push` | the section, the tasks, the critical alerts |
| network | none in the manifest | your services' hosts, granted at install |
| paths | none | |

## Install and configure

```sh
horae plugin add mcp-brief@0.1.2 \
  --allow-host finance.example.org \
  --allow-host health.example.org
```

A service whose host is not approved is degraded with `host_not_approved` before anything is
sent. URLs are `https` only, with a DNS name (no IP address, no `localhost`). Put a service's
token in the secret its entry names (`/run/secrets/MCP_BRIEF_TOKEN_1`).

## Example

```yaml
steps:
  - collect:
      - mcp-brief.collect:
          services:
            - id: finance
              url: https://finance.example.org/mcp
              token_secret: MCP_BRIEF_TOKEN_1
              link_prefix: [https://finance.example.org/app/]
            - id: health
              url: https://health.example.org/mcp
  - act:
      - obsidian.write_note: { path: "Daily/{{date}}.assistant.md", mode: replace-owned }
      - obsidian.write_task: { mode: tasks, link_prefix: "https://finance.example.org/app/" }
  - notify:
      - ntfy.push:
          server: https://ntfy.example.org
          topic: horae-alerts
          link_prefix: https://finance.example.org/app/
          dedupe: "off"
```

List in the plugin's `link_prefix` what the `act` and `notify` entries already trust, or the core
drops the link.

## Making a service briefable

Any MCP service can feed Horae by exposing a `brief()` tool that returns a headline, alerts,
tasks, links and a status: aggregates only, never raw data. The contract, its JSON Schema with
valid and invalid examples, and an example service are in the repository:
[docs/brief-contract.md](https://github.com/horae-dev/plugin-mcp-brief/blob/main/docs/brief-contract.md).

## Repository

[horae-dev/plugin-mcp-brief](https://github.com/horae-dev/plugin-mcp-brief): every parameter and
failure reason.
