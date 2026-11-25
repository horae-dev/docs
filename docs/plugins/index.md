# Plugins

Everything Horae reads or changes outside itself goes through a plugin. Each one lives in its own
repository under [horae-dev](https://github.com/horae-dev), declares its permissions in
`plugin.yaml`, and is installed pinned to a commit. How plugins work, and what the permissions
mean: [Plugins and permissions](../concepts/plugins.md).

!!! warning "Pre-release"
    The versions below are released (tagged and listed in the
    [marketplace](https://github.com/horae-dev/marketplace)), but the core is not, so you install
    them from a checkout or a self-built image of the core. Most READMEs still mark their plugin
    "early" or "in progress", and the decisions they rely on are provisional. Each page says
    what has and has not been tested.

## Catalogue

| Plugin | What it does | LLM | Marketplace | Repository |
|---|---|---|---|---|
| [Daily brief](pack-daily-brief.md) (pack) | the morning note: calendar, open tasks and GitHub work, ranked and worded by one LLM call | yes, one bounded step | `pack-daily-brief` 0.1.1 | [pack-daily-brief](https://github.com/horae-dev/pack-daily-brief) |
| [Reminders](pack-reminders.md) (pack) | `⏰` reminders, a morning digest and overdue nudges from the vault, through ntfy | no | not listed | [pack-reminders](https://github.com/horae-dev/pack-reminders) |
| [Gmail](gmail.md) | rules-first Gmail triage: your rules decide, the rest goes to the pipeline's LLM step; tasks out | the pipeline's step, for mail no rule decided | `gmail` 0.4.0 | [plugin-gmail](https://github.com/horae-dev/plugin-gmail) |
| [IMAP and Proton Mail](imap.md) | new mail from IMAP folders, read-only, as requests and dates by rules | no | `imap` 0.1.3 | [plugin-imap](https://github.com/horae-dev/plugin-imap) |
| [Calendars](calendar.md) | events from ICS feeds, CalDAV and the Google Calendar API; preparation tasks | no | `calendar` 0.1.2 | [plugin-calendar](https://github.com/horae-dev/plugin-calendar) |
| [Obsidian vault](obsidian.md) | reads open tasks, writes owned notes and task lines, reminder and note-layout transforms | no | `obsidian` 0.2.1 | [plugin-obsidian](https://github.com/horae-dev/plugin-obsidian) |
| [LiveSync](livesync.md) | keeps an Obsidian vault as plain files on the server (E2EE CouchDB); reports sync health | no | `livesync` 0.1.3 | [plugin-livesync](https://github.com/horae-dev/plugin-livesync) |
| [GitHub](github.md) | review requests, assignments, mentions and notifications as tasks; failing CI; what is new for you | no | `github` 0.6.0 | [plugin-github](https://github.com/horae-dev/plugin-github) |
| [ntfy](ntfy.md) | push notifications with priorities, quiet hours, daily dedupe and action buttons | no | `ntfy` 0.3.4 | [plugin-ntfy](https://github.com/horae-dev/plugin-ntfy) |
| [Home Assistant](homeassistant.md) | notifications through HA's `notify` services; household reminders from entity states | no | `homeassistant` 0.2.2 | [plugin-homeassistant](https://github.com/horae-dev/plugin-homeassistant) |
| [School (PRONOTE, ÉcoleDirecte)](school-fr.md) | read-only homework, grades and things to sign, behind a lockout-safe budget | no | `school-fr` 0.4.2 | [plugin-school-fr](https://github.com/horae-dev/plugin-school-fr) |
| [MCP brief](mcp-brief.md) | calls a `brief()` tool on your own MCP services: note sections, tasks, alerts | no | `mcp-brief` 0.1.2 | [plugin-mcp-brief](https://github.com/horae-dev/plugin-mcp-brief) |

No plugin calls a model itself. A plugin can ship a **skill** that the core's `llm` step runs;
the daily brief and the Gmail triage do.

## Install a plugin

From the instance (inside the container: `docker compose exec horae horae ...`):

```sh
horae plugin search                          # what the configured marketplaces list
horae plugin add <name>@<version>            # for example: horae plugin add github@0.6.0
```

`horae plugin add` clones the repository at the pinned commit, checks that the tag and the
commit agree, shows the permissions the plugin asks for and asks you to approve them, pins it in
`horae.lock`, and installs its dependencies in its own venv. Grant what depends on your setup at
the same time:

| Flag | Grants | Example |
|---|---|---|
| `--allow-path PATH` | read and write access to an absolute path | the vault, for `obsidian` |
| `--allow-read-path PATH` | read-only access | the LiveSync status directory, for `livesync` |
| `--allow-host HOST` | an `https` host | your ntfy server, your Home Assistant, your school's PRONOTE host |
| `--allow-local HOST:PORT` | a LAN or loopback endpoint (plain `http` allowed) | `127.0.0.1:1143` for Proton Mail Bridge |

Each flag is repeatable and recorded in the lock as yours. Then put the plugin's secrets in the
secrets directory (one file per secret, `/run/secrets/<NAME>` by default), and use its tools in
a pipeline. Upgrading, removing and auditing: [Marketplace and the lock](../concepts/marketplace.md).

!!! note "Pipeline packs"
    A pack (`pack-*`) ships pipelines and skills, and no process. `horae plugin add` copies its
    pipelines to `pipelines/<pack>/`; they run once the pack is listed under `plugins:` in
    `horae.yaml`. A pack's pipeline calls other plugins: install those too.

## Write your own

- [Writing a plugin](writing-a-plugin.md): the SDK, the manifest, tests, publishing.
- [Plugin template](template.md): a repository whose CI passes before you write a line.
