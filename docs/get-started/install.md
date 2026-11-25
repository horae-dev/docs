# Install with Docker

Horae ships as one container image, `ghcr.io/horae-dev/horae`, and two deployment templates in
the core repository: plain Docker Compose and Coolify. This page gets each of them running; the
[Operate](../operate/index.md) pages have the full guides.

!!! warning "Pre-release"
    There is no tagged release yet. CI publishes an image for every commit of `main` that
    passes its checks (tags `sha-<short>` and `edge`, signed with cosign), and the templates
    pin one `sha-<short>` that is bumped by hand. Whether the GHCR package can be pulled
    without credentials is a setting of the organisation: check it first (below). If it
    cannot, build the image from a checkout.

## Before you start

You need Docker with the Compose plugin (Docker Engine 25 or later if you will run plugins
with `runtime: container`, see [Plugin containers](../security/plugin-containers.md)).

Check that the image can be pulled anonymously:

```sh
curl -s -o /dev/null -w '%{http_code}\n' \
  'https://ghcr.io/token?scope=repository:horae-dev/horae:pull'
```

`200` means the package is public: pull it. `401` means it is not (yet): build it.

## Pick a way to run it

=== "Docker Compose"

    The template in [`deploy/compose/`](https://github.com/horae-dev/horae/tree/main/deploy/compose)
    runs Horae alone, on `127.0.0.1`, with a read-only root filesystem, a named volume for the
    instance and the built-in scheduler. A one-off `horae-init` service creates the example
    instance in a new volume.

    ```sh
    git clone https://github.com/horae-dev/horae.git
    cd horae/deploy/compose
    cp .env.example .env
    mkdir -p secrets
    docker compose up -d
    ```

    If the image cannot be pulled, build it and point the template at it:

    ```sh
    cd horae
    docker build -t horae:local .
    cd deploy/compose
    cat > local.yaml <<'EOF'
    services:
      horae-init: {image: "horae:local"}
      horae: {image: "horae:local"}
    EOF
    export COMPOSE_FILE=docker-compose.yaml:local.yaml
    docker compose up -d
    ```

    Then check it:

    ```sh
    docker compose ps -a                    # horae: Up (healthy); horae-init: Exited (0)
    curl -s http://127.0.0.1:8080/healthz    # {"status": "ok", ...}
    docker compose exec horae horae doctor
    docker compose exec horae horae run daily-fixture --dry-run
    ```

    Full guide, secrets, scheduling with host cron, and the Traefik and SSO override:
    [Docker Compose](../operate/compose.md).

=== "The image alone"

    The image runs as uid `10001`, under tini, and works with a read-only root filesystem. It
    declares no volume: mount one on `/instance`, or the instance is lost with the container.

    ```sh
    docker volume create horae
    opts=(--rm --read-only --tmpfs /tmp --cap-drop ALL --security-opt no-new-privileges
          -v horae:/instance)
    docker run "${opts[@]}" ghcr.io/horae-dev/horae:edge init /instance
    docker run "${opts[@]}" ghcr.io/horae-dev/horae:edge doctor
    docker run "${opts[@]}" --network none ghcr.io/horae-dev/horae:edge run daily-fixture
    ```

    The note lands in the volume's `vault/Daily/`. In production, pin a `sha-<short>` tag and its
    digest, and verify the signature first: [Container image](../operate/container-image.md).

=== "Coolify"

    [`deploy/coolify/docker-compose.yaml`](https://github.com/horae-dev/horae/blob/main/deploy/coolify/docker-compose.yaml)
    is a Coolify **Docker Compose Empty** resource with its own Traefik routers and an SSO
    forwardAuth middleware; only `/act/` is exempt from SSO. You need a Coolify server with its
    Traefik proxy, an SSO provider (authentik is the reference), a DNS name or a Cloudflare
    Tunnel, an Anthropic API key and two Uptime Kuma push URLs.

    1. **+ New, Resource, Docker Compose Empty**. Paste the template and save.
    2. **Edit Compose**: turn **off** "Escape special characters in labels".
    3. Leave the **Domains** of both services empty.
    4. Set the four required variables (`HORAE_PUBLIC_HOST`, `HORAE_ANTHROPIC_API_KEY`,
       `HORAE_MONITOR_DAILY_BRIEF_URL`, `HORAE_MONITOR_REMIND_URL`); on Coolify's default proxy,
       also `HORAE_TRAEFIK_CERTRESOLVER=letsencrypt`.
    5. Deploy, then open `https://<your host>/healthz` through the SSO sign-in.

    The steps in detail are in the [Quickstart](quickstart.md#coolify); the layout, the tunnel
    mode, forwarded headers and the checks to run on the server are in
    [Coolify](../operate/coolify.md).

=== "From a checkout"

    No Docker: Python 3.12 and [uv](https://docs.astral.sh/uv/getting-started/installation/).

    ```sh
    git clone https://github.com/horae-dev/horae.git
    cd horae
    uv sync
    uv run horae init ~/horae-demo
    uv run horae doctor -i ~/horae-demo
    ```

    `horae serve -i ~/horae-demo` then runs the scheduler and the read-only HTTP API on
    `127.0.0.1:8080`. See the [Quickstart](quickstart.md#try-it-from-a-checkout).

!!! danger "The HTTP API has no authentication of its own"
    `horae serve` answers `/healthz` and `/runs` to anyone who can reach it. The templates bind
    it to loopback or put it behind the reverse proxy and its SSO. Never publish it on another
    interface.

## After the install

1. **Your instance.** Replace the example `horae.yaml`, `pipelines/` and `horae.lock` in the
   volume with your own, and put secrets as files (one per secret) in the secrets directory.
   [Your first pipeline](first-pipeline.md) shows the files.
2. **A model.** Add a model alias under `models:` in `horae.yaml` if a pipeline has an `llm`
   step: [The LLM step](../concepts/llm-step.md).
3. **Plugins.** `horae plugin add <name>@<version>` inside the container (it needs network
   access to git and the package index): [Plugins](../plugins/index.md).
4. **Backups.** Back up the volume, and the vault if it lives elsewhere:
   [Retention and backups](../operate/retention-and-backups.md).
