# Home Assistant

Two tools for a Home Assistant instance. `homeassistant.push` is a **notifier**: it delivers
`notify.push` intents through one of HA's `notify` services (the companion app on your phone,
say), and can call **only** `notify.*` services. `homeassistant.reminders` is a **read-only
source**: it reads entity states and proposes a reminder per matching entity (a battery under
20 %, a non-empty shopping list, a filter counter running out, a finished washer cycle), from
rules you configure.

!!! note "Status"
    Version 0.2.2, listed in the marketplace (requires `horae-sdk` 0.9). Not in 0.2.2: reading a
    to-do list's items or a calendar's event list, quiet hours and once-a-day state, notification
    channels, images and TTS.

## What it reads and writes

| Tool | Kind | Calls | Proposes or applies |
|---|---|---|---|
| `homeassistant.push` | notifier | `POST /api/services/notify/<service>` | applies `notify.push` |
| `homeassistant.reminders` | source | `GET /api/states`, `GET /api/states/<entity_id>` only | proposes `task.create` or `notify.push` per matching entity |

The source's HTTP layer refuses any other method or path before it reaches the network, whatever
the rules say. A `todo.*` entity's state is its number of open items; a `calendar.*` entity
exposes its next event.

## Permissions

From `plugin.yaml`:

| Kind | Value | Why |
|---|---|---|
| intents | `notify.push` | applied by the notifier, proposed by the source |
| intents | `task.create` | proposed by the source |
| secret | `HA_TOKEN` | the long-lived access token, sent only to your HA host |
| network | none in the manifest | your HA host, granted at install |
| paths | none | |

## Install and configure

```sh
horae plugin add homeassistant@0.2.2 --allow-host ha.example.org
# or, on the LAN over http:
horae plugin add homeassistant@0.2.2 --allow-local homeassistant.local:8123
```

1. In HA: your profile, **Security**, **Long-lived access tokens**, **Create token**. Prefer a
   dedicated, non-admin user. Store the token as `/run/secrets/HA_TOKEN`.
2. Find the notify service in **Developer tools > Actions**: `notify.mobile_app_pixel_8` gives
   `service: mobile_app_pixel_8`.

The plugin refuses a `url` whose host is not approved in `horae.lock`, before it reads the token.

## Example

```yaml
# pipelines/home.yaml
name: home
trigger: { cron: "0 18 * * *" }
steps:
  - collect:
      - homeassistant.reminders:
          url: https://ha.example.org
          timezone: Europe/Paris
          rules:
            - id: low-battery
              entity: sensor.*_battery
              when: [{below: 20}]
              intent: task.create
              title: "Replace the battery of {name} ({state}{unit})"
              due_in_days: 2
            - id: shopping
              entity: todo.shopping
              when: [{above: 0}]
              intent: notify.push
              title: "Shopping list: {state} items to buy"
  - act:
      - obsidian.write_task: { mode: tasks }
  - notify:
      - homeassistant.push:
          url: https://ha.example.org
          service: mobile_app_pixel
          priority: normal
```

## Repository

[horae-dev/plugin-homeassistant](https://github.com/horae-dev/plugin-homeassistant): rule
syntax, what reaches the phone, priorities, failures.
