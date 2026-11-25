# LiveSync

Keeps an Obsidian vault as plain files on the server, so that Horae's other plugins can read and
write it while your phone and desktop keep syncing. It has two pieces in one repository:

- **The sidecar** (`horae-livesync run`, its own container, image
  `ghcr.io/horae-dev/horae-livesync`): runs the official **Self-hosted LiveSync CLI** in daemon
  mode, which mirrors the end-to-end-encrypted LiveSync CouchDB database into a vault folder and
  back. It renders the CLI's settings from `livesync.yaml` and two secrets, supervises the CLI and
  writes a `status.json`.
- **The plugin** (`livesync`): one source, `livesync.status`, that reads `status.json` and returns
  the sync's health. It proposes nothing and connects to nothing.

```text
 Obsidian (desktop, phone) ──E2EE──▶ CouchDB
                                        ▲
 ┌─ livesync (sidecar) ─────────────────┴──┐      ┌─ horae ───────────────────────┐
 │  livesync-cli daemon (official, MIT)    │      │ plugin-obsidian  ─▶ /vault    │
 │ /vault  /livesync (PouchDB)  /status    │      │ livesync.status ◀─ /status:ro │
 └────┬──────────────────────────────┬─────┘      └──────┬───────────────┬────────┘
      └────────── volume: the vault ─────────────────────┘               │
                                     └── volume: the status ─────────────┘
```

!!! warning "Status"
    Version 0.1.3, listed in the marketplace. The sidecar, the health source, a nightly git
    snapshot and a setup and recovery guide are in. **The end-to-end-encryption parity check with
    the Obsidian plugin is not done**, and conflicts between the server's writes and a phone's
    edits are a tracked risk ([roadmap](../project/roadmap.md#burning-points)). The image is built
    and tested for `linux/amd64` only.

## What it reads and writes

| Tool | Kind | Reads | Proposes |
|---|---|---|---|
| `livesync.status` | source | `status.json` from the status directory (at most 64 KiB, links not followed) | nothing |

It returns `healthy`, `live`, `problems`, `warnings`, `last_sync_at`, `lag_s`,
`pending_changes`, `remote_ok` and more. An unhealthy sync is data, not an error: a pipeline can
put it in the morning note or notify on it.

## Permissions

From `plugin.yaml`: **none** (`permissions: {}`).

| Kind | Value | Why |
|---|---|---|
| intents | none | a pure health source |
| network | none | only the sidecar talks to CouchDB |
| secrets | none | the plugin never sees the CouchDB password or the passphrase |
| paths | none in the manifest | **the status directory**, granted read-only at install |

The sidecar is not a Horae plugin process and has no manifest: what it may touch is set by its
container.

## Install and configure

```sh
horae plugin add livesync@0.1.3 --allow-read-path /livesync-status
```

The sidecar reads its own `livesync.yaml`, kept next to `horae.yaml` (Horae's configuration has no
room for a plugin's settings):

| Key | Meaning |
|---|---|
| `couchdb.url`, `couchdb.database`, `couchdb.username` | the LiveSync database and a **dedicated** CouchDB user (not the server admin, not your clients' user) |
| `couchdb.password_secret`, `e2ee.passphrase_secret` | names of the secrets holding the password and the E2EE passphrase; E2EE is always on |
| `e2ee.path_obfuscation` | default `true`; must match your Obsidian clients |
| `sync.mode` | `live` (the `_changes` feed, default) or `poll` |
| `settings` | only the settings every LiveSync device must share, from an allow-list |

## Example

```yaml
- collect:
    - livesync.status: {}                 # the thresholds of livesync.yaml
    - livesync.status: { max_lag_s: 600 } # or your own
```

## Repository

[horae-dev/plugin-livesync](https://github.com/horae-dev/plugin-livesync): deploying the sidecar,
health thresholds, the nightly snapshot and restore, TLS, licences.
