# School (PRONOTE, ÉcoleDirecte)

Homework, grades and things to sign from the two French school platforms, **read-only**.
`school-fr.pronote` and `school-fr.ecoledirecte` read a parent's account and turn undone homework
and unread messages to acknowledge into tasks; grades are data only. Every login goes through a
deliberately conservative, persistent budget, because repeated or failed logins can lock a
parent's account.

!!! warning "Status: unofficial APIs"
    Version 0.4.2, listed in the marketplace. **Both platforms are reverse-engineered,
    unofficial APIs** that may change without notice. PRONOTE goes through the
    [pronotepy](https://github.com/bain3/pronotepy) library; ÉcoleDirecte through the plugin's own
    small client. Both have been tested only against recorded or synthetic data, **not** a real
    account: try them on yours before you trust them.

## What it reads and writes

| Tool | Kind | What it does |
|---|---|---|
| `school-fr.pronote` | source | homework due in the next `days_ahead` days, grades of the current period, the list of unread informations and surveys |
| `school-fr.ecoledirecte` | source | homework, grades, the list of unread received messages (never opened, because opening marks them read) |
| `school-fr.status` | source | the budget state of each account; never logs in, never touches the network |

| Item | Becomes |
|---|---|
| homework not done | data and a `task.create` |
| homework done | data only |
| grade | data only, never a task |
| something to sign or acknowledge | data and a `task.create` |

It never writes to the platform: no homework marked done, no message marked read, nothing sent.
Each client is wrapped so that only read calls on an allow-list can reach the network, and a test
checks it.

**De-identification.** The children's first names and the teachers' names are declared as
personal fields in the manifest. With a cloud model alias, the core replaces them (and any string
that contains them) with pseudonyms before the request leaves, whatever the skill declares, and
restores them in the answer. Nicknames, initials and names of fewer than three letters are not
matched.

## The budget

Per account, per local day:

| Setting | Default | Meaning |
|---|---|---|
| `max_polls_per_day` | 4 (1 to 12) | attempts that may touch the network |
| `min_interval` | `2h` | least time between two polls |
| `windows` | any time | allowed local-time windows, `["07:00-08:00", "17:00-20:00"]` |
| `max_logins_per_day` | at most 6 | logins per day |

One attempt per call, **never a retry**. After a network or parse failure, the account backs off
(1 h, then doubling, at most 24 h). After an **authentication failure** the account is **stopped**
until you reset it by hand: there is no tool for that, on purpose. A refused call makes no network
call and marks the step `degraded`.

## Permissions

From `plugin.yaml`:

| Kind | Value | Why |
|---|---|---|
| network | `api.ecoledirecte.com` | the ÉcoleDirecte API, the only host its client contacts |
| optional secret | `PRONOTE_CREDENTIALS` | the first PRONOTE credentials, from the setup helper |
| optional secret | `ECOLEDIRECTE_CREDENTIALS` | the ÉcoleDirecte user name and password |
| intents | `task.create` | undone homework and things to sign |
| paths | none in the manifest | the directory of the budget state and the credential stores, granted at install |
| personal fields | `children[].first_name`, `homework[].teacher`, `grades[].teacher` | for de-identification |

PRONOTE servers are `<school>.index-education.net` or a custom domain, so the manifest declares no
PRONOTE host: grant your school's host at install.

## Install and configure

```sh
horae plugin add school-fr@0.4.2 \
  --allow-host 0000000a.index-education.net \
  --allow-path /instance/state/school
```

=== "PRONOTE"

    In PRONOTE (website, parent account): *Mon compte → Application mobile → Générer un QR
    code*, with a 4-digit code; save the QR code's content as JSON. Then, once, with the
    plugin's Python environment:

    ```sh
    python3 -m horae_school_fr pronote-setup --account famille --qr qr.json
    ```

    It logs in **once** and prints the credentials (PRONOTE's token, not your password): put
    them in the `PRONOTE_CREDENTIALS` secret, or write them to a store with `--store`. A wrong
    PIN or an expired code is one failed attempt: generate a new QR code, do not loop.

=== "ÉcoleDirecte"

    Put `{"famille": {"username": "...", "password": "..."}}` in the
    `ECOLEDIRECTE_CREDENTIALS` secret. ÉcoleDirecte asks a security question for an unknown
    device; a scheduled source never answers it. Answer it once with the helper:

    ```sh
    python3 -m horae_school_fr ecoledirecte-setup --account famille \
      --store /instance/state/school/ecoledirecte-device.json
    ```

    Later logins present the trusted device it stores.

## Example

```yaml
name: school
trigger: { cron: "30 17 * * 1-5" }
steps:
  - collect:
      - school-fr.pronote:
          account: famille
          state_path: /instance/state/school/state.json
          max_polls_per_day: 2
          windows: ["17:00-20:00"]
          days_ahead: 14
  - act:
      - obsidian.write_task: { mode: tasks }
```

## Repository

[horae-dev/plugin-school-fr](https://github.com/horae-dev/plugin-school-fr): every parameter,
where the rotating credentials live, failures, resetting an auth stop.
