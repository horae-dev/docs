# Calendars

Calendar events for your pipelines. `calendar.events` reads a window of whole days from ICS feeds
(a Proton Calendar share link, a Google Calendar secret address, any ICS URL on a host you allow),
from **CalDAV** calendars (iCloud with an app-specific password, Fastmail, Nextcloud) and from the
**Google Calendar API**, with recurring events expanded. `calendar.prep_tasks` turns the events
that need preparation into tasks due before them.

!!! note "Status"
    Version 0.1.2, listed in the marketplace. ICS, CalDAV and the Google Calendar API are in, as
    are preparation tasks.

## What it reads and writes

| Tool | Kind | Reads | Proposes |
|---|---|---|---|
| `calendar.events` | source | the events of 1 to 62 days, from up to 16 calendars | nothing |
| `calendar.prep_tasks` | transform | the `calendar.events` data of the run | `task.create`, one per matching event occurrence, due `lead_days` before it |

Titles, locations and descriptions are cleaned as plain text. Cancelled events are left out,
`tentative` ones kept. With `partial: true`, a calendar that fails gives the others' events
(`complete: false`) instead of failing the source.

## Permissions

From `plugin.yaml`:

| Kind | Value | Why |
|---|---|---|
| network | `calendar.google.com` | Google Calendar secret addresses (ICS) |
| network | `calendar.proton.me` | Proton Calendar share links (ICS) |
| network | `www.googleapis.com` | the Google Calendar API (read-only scope) |
| network | `oauth2.googleapis.com` | Google's token endpoint |
| network | `caldav.icloud.com` | iCloud CalDAV (a `pNN-caldav.icloud.com` shard is added per instance) |
| optional secret | `CALENDAR_ICS_URLS` | the feed URLs, separated by spaces (each holds an access token) |
| optional secret | `CALENDAR_CALDAV` | `url user password` triples |
| optional secret | `CALENDAR_GOOGLE` | `client_id client_secret refresh_token` triples |
| intents | `task.create` | `calendar.prep_tasks` |
| paths | none | |

## Install and configure

```sh
horae plugin add calendar@0.1.2
```

**The feed URLs are secrets.** A share link grants read access to anyone who holds it, so it goes
in a secret, never in a pipeline parameter. All ICS feeds go in one secret, on one line:

```text
# /run/secrets/CALENDAR_ICS_URLS
https://calendar.proton.me/api/calendar/v1/url/…/calendar.ics?… https://calendar.google.com/calendar/ical/…/basic.ics
```

A calendar refers to its URL by its 1-based `index`. `webcal://` links are read as `https://`;
plain `http://` is refused. For a feed on another host, grant it at install
(`--allow-host calendar.example.org`) and list it in the call's `allowed_hosts`.

## Example

```yaml
steps:
  - collect:
      - calendar.events:
          calendars:
            - { name: Personal, index: 1 }                  # the first URL of CALENDAR_ICS_URLS
            - { name: Family, index: 2 }
            - { name: iCloud, index: 1, type: caldav }      # the first account of CALENDAR_CALDAV
            - { name: Google, index: 1, type: google }      # the primary calendar of CALENDAR_GOOGLE
          start: "{{date}}"
          timezone: "{{timezone}}"
          days: 2
          partial: true
  - transform:
      - calendar.prep_tasks:
          today: "{{date}}"
          rules:
            - keywords: [review, trip]      # in the title, ignoring case
              lead_days: 2                  # due two days before
              title: "Prepare: ${title}"
  - act:
      - obsidian.write_task: { mode: tasks }
```

`calendar.events: { days: 2 }` alone reads every ICS URL of the secret over today and tomorrow.
Pass `start: "{{date}}"` so that a replay reads the same window. Each preparation task has the
fingerprint `calendar:prep:<event id>`, so a later run proposes the same task, not a new one.

## Repository

[horae-dev/plugin-calendar](https://github.com/horae-dev/plugin-calendar): CalDAV and Google
setup, recurrence rules, bounds and failures.
