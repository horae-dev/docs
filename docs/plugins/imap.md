# IMAP and Proton Mail

A generic, **read-only** IMAP source. `imap.messages` reads the mail that arrived since the last
run in the folders you choose, applies your rules (sender, subject, list id; no LLM) and returns
`request` and `date` items, optionally as `task.create` intents. Proton Mail through Proton Mail
Bridge is the same source pointed at `127.0.0.1`.

**It never changes the mailbox.** Folders are opened with `EXAMINE`, messages fetched with
`BODY.PEEK`, and every command goes through an allow-list (`CAPABILITY`, `STARTTLS`, `LOGIN`,
`EXAMINE`, `UID SEARCH`, `UID FETCH`, `LOGOUT`): nothing is marked read, moved or deleted. A test
compares every flag on a real server before and after. It never follows a link in a mail, and
returns only an escaped, capped snippet of a body.

!!! note "Status"
    Version 0.1.3, listed in the marketplace. Requires `horae-sdk` 0.9.

## What it reads and writes

| Tool | Kind | Reads | Proposes |
|---|---|---|---|
| `imap.messages` | source | headers and the first KiB of the text of new messages, in up to 8 folders | `task.create` per item, only with `emit_tasks: true` |

Rules decide what becomes an item:

- **`request`**: the message asks for something. Its due date is the first date found in the
  subject and text that is not before the message's own day.
- **`date`**: the message announces a date; an item exists only when one is found. Dates are
  extracted conservatively, in French and English (`2026-11-15`, `15/11/2026`,
  `15 novembre 2026`, `November 15, 2026`...).

## Permissions

From `plugin.yaml`:

| Kind | Value | Why |
|---|---|---|
| network | `imap.gmail.com`, `imap.fastmail.com` | Gmail and Fastmail IMAP |
| network_local | `127.0.0.1:1143` | Proton Mail Bridge on this machine |
| secrets | `IMAP_USERNAME`, `IMAP_PASSWORD` | the login and the password or app password |
| intents | `task.create` | only with `emit_tasks` |
| paths | none declared | the since-state file's directory, granted per instance (`paths.write`) |

There is no LLM call, and no network access but the IMAP connection.

## Install and configure

```sh
horae plugin add imap@0.1.3 --allow-path /instance/state/imap
```

Put `IMAP_USERNAME` and `IMAP_PASSWORD` in the secrets directory. Another server than Gmail or
Fastmail must be granted at install (`--allow-host imap.example.org`) **and** listed in the call's
`allowed_hosts`.

=== "Gmail"

    Turn on 2-Step Verification, create an app password and use it as `IMAP_PASSWORD`; enable
    IMAP in Gmail's settings.

    ```yaml
    - imap.messages:
        host: imap.gmail.com
        state_path: /instance/state/imap/gmail.json
        account: gmail
        folders: ["INBOX"]
        rules:
          - {name: school, kind: request, from: ["*@school.example.org"]}
    ```

=== "Proton Mail Bridge"

    Bridge listens on `127.0.0.1` (IMAP 1143 with STARTTLS) with its own username and password.
    Approve `127.0.0.1:1143` (`network_local`) at install. Its certificate is self-signed and the
    plugin never relaxes verification: give the certificate as `ca_file` (a PEM file in a path
    granted for reading), which is trusted for that connection only.

    ```yaml
    - imap.messages:
        host: 127.0.0.1
        port: 1143
        security: starttls
        state_path: /instance/state/imap/proton.json
        account: proton
    ```

## Example pipeline step

```yaml
- collect:
    - imap.messages:
        host: imap.gmail.com
        state_path: /instance/state/imap/gmail.json
        account: gmail
        emit_tasks: true
        rules:
          - name: school-requests
            kind: request
            from: ["*@school.example.org"]
            subject: ["*autorisation*", "*inscription*", "*please reply*"]
            task_prefix: "Reply: "
          - name: school-news
            kind: date
            list_id: ["news.school.example.org"]
- act:
    - obsidian.write_task: { mode: tasks }
```

## Repository

[horae-dev/plugin-imap](https://github.com/horae-dev/plugin-imap): every parameter, task links
(`link_template`), the since-state and the Proton Bridge recipe.
