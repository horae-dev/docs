# Operate

Horae is one container (`horae serve`: the scheduler and a small read-only HTTP API), one
SQLite file and a folder of YAML. These pages cover running it for real: deployment, the image,
backups, and exposing it to other agents.

!!! warning "Pre-release"
    No tagged release exists yet. The deploy templates pin an image built from `main`, bumped by
    hand. See [Install with Docker](../get-started/install.md) for the short version of each
    path.

| Page | What it covers |
|---|---|
| [Docker Compose](compose.md) | the plain Compose template: Horae on loopback, secrets as files, built-in or host cron, the optional Traefik and SSO override |
| [Coolify](coolify.md) | the reference deployment: hand-written Traefik routers, SSO forwardAuth, a Cloudflare Tunnel option, Scheduled Tasks, push monitors, what was verified on a real server |
| [Container image](container-image.md) | tags, verifying the cosign signature, the runtime contract (uid, read-only root, `/instance`), installing plugins in the container, upgrading |
| [Retention and backups](retention-and-backups.md) | what the store keeps, how to prune it and back it up by hand |
| [MCP server](mcp.md) | `horae mcp serve`: read-only tools for other agents, tokens, and an approval-gated `pipeline.run` |
| [Releasing](releasing.md) | how the maintainer cuts a release of the package and the image |

## Things to know first

- **The HTTP API has no authentication of its own.** Bind it to loopback, or put it behind the
  reverse proxy and its SSO. Only `/act/` (the signed notification buttons) is exempt.
- **Scheduling** is built in (`horae serve` fires each pipeline's `trigger`) or external
  (`scheduler.mode: external`, then cron, systemd or Coolify call `horae run <pipeline>`). Use
  one, not both.
- **Monitor the runs.** `scheduler.monitors.<pipeline>` pings an Uptime Kuma or Healthchecks
  push URL after each run; a missed fire time is never caught up.
- **Back up** the state directory and the vault, with an offsite copy.
- **An instance is not relocatable**: `horae.lock` holds absolute paths. `horae doctor`
  reports what no longer matches after a move.
