# Plugins and permissions

Everything Horae reads and writes outside itself goes through a plugin: a calendar, a mailbox,
the vault, a notification server. A plugin is an **MCP server** the core starts for a run and
calls explicitly from pipeline steps
([ADR 0003](https://github.com/horae-dev/horae/blob/main/docs/adr/0003-mcp-as-the-plugin-protocol.md)).
It returns data and proposes intents; it never applies anything itself.

## What a plugin provides

| Role | Used in | What it does |
|---|---|---|
| source | `collect` | reads data, and may propose intents (a task per review request, say) |
| transform | `transform` | turns collected data into other data or proposals, deterministically |
| sink | `act` | applies intents the core routed to it (writes a note, edits a task line) |
| notifier | `notify` | applies `notify.push` (sends a push) |
| skill | `llm` | a prompt and an output schema for the core's LLM step |
| pipeline | (copied into the instance) | a ready-made pipeline; a plugin that ships only these is a **pack** |

## The manifest

Each plugin has a `plugin.yaml`. The SDK generates it from the code, so it cannot drift:

```yaml
name: github
version: 0.6.0
horae: '>=0,<0.2'
description: GitHub review requests, assignments, mentions and notifications as tasks; ...
license: Apache-2.0
provides:
  sources: [github.review_requests, github.assigned, github.mentions,
            github.notifications, github.ci_failures, github.updates]
permissions:
  network: [api.github.com]
  secrets: [GITHUB_TOKEN]
  optional_secrets: [GITHUB_NOTIFICATIONS_TOKEN]
  intents: [task.create, notify.push]
runtime:
  protocol: mcp-stdio
  command: [python3, -m, horae_github]
```

`runtime` is `mcp-stdio` (a local process started from an argument list, no shell) or `mcp-http`
(a remote service, whose host must be declared). A pack has no `runtime`. The contract is
[`schemas/plugin-manifest/v1.json`](https://github.com/horae-dev/horae/blob/main/schemas/plugin-manifest/v1.json).

## Permissions

Permissions default to **nothing**. A plugin declares what it needs:

| Permission | What it grants |
|---|---|
| `network` | `https` hosts the plugin may contact, exact DNS names (no wildcard, no IP literal) |
| `network_local` | exact `host:port` endpoints on this machine or the LAN (a mail bridge on `127.0.0.1:1143`, a self-hosted ntfy); plain `http` is allowed only there |
| `secrets` | secrets injected into this plugin only; each must resolve |
| `optional_secrets` | secrets injected only when they resolve |
| `paths` | `read` and `write` lists of absolute paths |
| `intents` | the intent types the plugin may propose or apply; empty means no writes at all |

**You approve them at install.** `horae plugin add` shows them and asks; `horae.lock` records
what you approved. The core enforces the **approved** list, not the manifest:

- a path, host or endpoint that depends on your setup (your vault, your Home Assistant, your
  ntfy server) is not in the manifest; you grant it at install with `--allow-path`,
  `--allow-read-path`, `--allow-host` or `--allow-local`, recorded in the lock as yours and kept
  across upgrades;
- the core sends the approved hosts and paths with every call, and the first-party plugins
  refuse anything else before they connect or open a file;
- an upgrade that asks for more must be approved again.

## Secrets

Secrets are files: `<secrets.dir>/<NAME>`, `/run/secrets` by default, one file per secret. A
`secrets.refs` entry in `horae.yaml` can point a name at another file or an environment
variable. A plugin gets **only** its declared secrets, in a clean environment. The core redacts
every secret it resolved from the plugin's output, as a last line of defence. Never put a
secret in a pipeline parameter: parameters are stored in run records.

## Two enforcement tiers

=== "`runtime: process` (default)"

    The plugin is a child process of Horae: your user, your network. It gets a clean
    environment with only its declared secrets, its calls carry the approved hosts and paths,
    and its proposals are checked against its approved intents. Nothing at the operating-system
    level stops a plugin that ignores the approved list: this tier is for **first-party**
    plugins only.

=== "`runtime: container`"

    The plugin runs in its own Docker container: non-root, read-only root filesystem, no
    capability, Docker's default seccomp profile, a `noexec` tmpfs on `/tmp`, CPU, memory and
    process limits, only its own tree and the approved paths mounted. Its network is internal,
    with no route out: its only exit is an **allow-list egress proxy** built from the approved
    hosts. Secrets reach it through stdin, never its command line. If the container cannot
    start, the plugin fails with `runtime_unavailable`; it never falls back to a process.

    Set it per plugin (`plugins.<name>.runtime: container`) or for all
    (`plugin_defaults.runtime: container`) in `horae.yaml`. Details, prerequisites and measured
    latency: [Plugin containers and egress](../security/plugin-containers.md).

**Third-party plugins run only in a container.** A plugin that is not first-party (a community
entry, an index you added, a direct install from a git URL) installs and runs only with
`runtime: container`; `horae doctor` and `horae plugin audit` report one that would not.

## Per-plugin settings in `horae.yaml`

`horae.yaml` has no room for a plugin's own options: those are parameters of the pipeline
entries that call it. Under `plugins.<name>` it takes only how the plugin runs:

```yaml
plugin_defaults:
  startup_timeout_s: 10
  call_timeout_s: 30
  runtime: process
plugins:
  github: { call_timeout_s: 20, runtime: container, limits: { memory_mb: 1024 } }
  pack-daily-brief: {}          # a pack's pipelines run only once it is listed here
```

## Writing one

Any MCP server becomes a plugin by adding a manifest, in any language. The Python SDK,
`horae-sdk`, does the protocol work, generates the manifest and gives you recorded-input tests;
the [template repository](../plugins/template.md) is a working start.
See [Writing a plugin](../plugins/writing-a-plugin.md).

## Read more

- [Plugin SDK](../reference/sdk.md): the SDK reference.
- [Threat model](../security/threat-model.md): what each tier defends against.
- [Marketplace and the lock](marketplace.md): installing, upgrading and auditing.
