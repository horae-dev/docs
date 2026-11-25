# ntfy

Push notifications through an [ntfy](https://ntfy.sh) server. `ntfy.push` is a **notifier**: a
pipeline's `notify` step names it, the core routes each `notify.push` intent to it, and after the
run the core applies the intent through the plugin. It publishes the push with the entry's topic,
priority and tags, the intent's link as the click action, and the Done / Snooze buttons the core
minted. It proposes nothing.

!!! note "Status"
    Version 0.3.4, listed in the marketplace. Priorities, quiet hours, once-a-day reminders,
    links and action buttons are in. **Unverified**: whether a delayed push reaches an iPhone on
    time through a self-hosted server's `upstream-base-url`, and whether ntfy's `http` action
    buttons work on iOS ([roadmap](../project/roadmap.md#burning-points)).

## What it does

| Parameter | Meaning |
|---|---|
| `server` | `https://<host>[:port]`; required with `auth: token`. `http://` only for a LAN server approved as `network_local` |
| `topic` | the topic; not a secret (it is stored in run records). On a public server, choose a long, unguessable name or protect it |
| `priority` | `min`, `low`, `normal` (default), `high`, `critical`. Only `critical` bypasses quiet hours |
| `tags` | ntfy tags or emoji short codes, at most 8 |
| `auth` | `token` (default): send `NTFY_TOKEN`; `none` |
| `quiet_hours` | `{start: "22:00", end: "07:00", during: delay \| drop}`, local times. `delay` publishes with ntfy's scheduled delivery |
| `dedupe` | `daily` (default): a reminder is pushed once a day, which needs a state directory; `off` |
| `actions` | `http` (default): buttons POST the signed link; `view`: buttons open the confirmation page; `off` |
| `link_prefix` | read by the core: a link is routed to this entry only if it falls under it (`https://` or `obsidian://`) |

An unknown key or an invalid value fails the apply with `config_invalid`, naming the parameter.
Title and body are untrusted text, sent as plain text (Markdown never turned on), with control
and invisible characters removed.

**Duplicates.** Delivery is at least once. Every publish carries ntfy's `sequence_id`, so a push
published again replaces the earlier one on clients that support it (ntfy server 2.16 or later).

## Permissions

From `plugin.yaml`:

| Kind | Value | Why |
|---|---|---|
| intents | `notify.push` | the intent this notifier applies |
| network | `ntfy.sh` | the default server; your own server is granted at install |
| secret | `NTFY_TOKEN` | the access token, sent as `Authorization: Bearer` |
| paths | none in the manifest | one state directory, granted at install, for `dedupe: daily` |

## Install and configure

```sh
horae plugin add ntfy@0.3.4 \
  --allow-host ntfy.example.org \
  --allow-path /instance/state/ntfy
```

- Your own server: `--allow-host` for an `https` host, or `--allow-local ntfy.lan:80` for a LAN
  server over `http`.
- The state directory (`mkdir -m 0700`) must belong to the user running the plugin and be on a
  local file system (not NFS, SMB or a Docker Desktop bind mount). Without it, `dedupe: daily`
  fails with `state_unavailable`; `dedupe: off` needs none.
- Put the token (`tk_…`) in `/run/secrets/NTFY_TOKEN`, and set `timezone` in `horae.yaml`.
- A self-hosted server must keep a persistent message cache (`cache-file` or a database), or a
  restart loses every scheduled (delayed) push.

**Action buttons** need, in `horae.yaml`, `http.public_url` (an `https://` URL your phone can
reach) and the `HORAE_ACT_KEY` secret, and a `mode: tasks` entry in the pipeline. Each button is a
bearer link until it expires or is used: keep the topic private.

## Example

```yaml
- notify:
    - ntfy.push:
        server: https://ntfy.example.org
        topic: horae-reminders
        priority: high
        tags: [alarm_clock]
        quiet_hours: { start: "22:00", end: "07:00", during: delay }
        link_prefix: https://notes.example.org/daily/
        dedupe: daily
```

The [reminders pack](pack-reminders.md) is the complete pipeline that uses it.

## Repository

[horae-dev/plugin-ntfy](https://github.com/horae-dev/plugin-ntfy): the reminder state rules,
daylight saving, failures and what `apply` returns.
