# Product

<!-- impeccable:product-schema 1 -->

> Written on 2026-11-25 with the maintainer: scope, visual direction, languages and videos were chosen by them
> (shape interview); facts come from horae-dev/horae (README, docs, schemas, CLI) and the plugin repositories.

## Platform

web

## Stack

MkDocs Material with a custom landing page (`overrides/home.html`), deployed to GitHub Pages from GitHub Actions.
Reference pages are generated from the core repository at build time (`hooks/core.py`). Narrated canvas videos
under `docs/videos/` (canvas-video format, Kokoro voices). Same family as angelia-dev/docs.

## Users

- Self-hosters and developers who want a personal assistant they can trust next to their mail, calendars, notes
  vault and their children's school accounts. They arrive from GitHub or a blog post, decide in minutes whether the
  idea fits them, then want a runnable quickstart.
- Plugin authors, who need the contract: manifest, MCP stdio, declared permissions, recorded-input tests.

## Product Purpose

Horae is a predictable, self-hosted personal agent: pipelines (`collect → rules → llm → act → notify`) declared in
YAML and run on a schedule; one bounded LLM step (skill, output schema, model alias, budget, no tools); plugins
return intents that the core applies with a dry-run diff, a journal, undo and replay; declared permissions
approved at install and enforced at run time; a git marketplace pinned by commit in `horae.lock`.

## Positioning

The opposite of the agent loop: the control flow is written down, never chosen by a model. Cheap (a run that
finds nothing new costs nothing), testable, auditable, reversible. Bring your own model.

## Operating Context

Pre-release: no published package; runs from a checkout or a self-built image (Docker Compose, Coolify).
English documentation; videos in English and French.

## Capabilities and Constraints

- Docs match the code on `main` of horae-dev/horae; planned work is labelled as planned.
- First-party plugins: gmail, imap, calendar, obsidian, livesync, github, ntfy, homeassistant, school-fr,
  mcp-brief; packs daily-brief and reminders.
- No third-party requests from the site (self-hosted fonts, no analytics). No real secrets or personal data.

## Brand Commitments

- Name: the Horae, Greek goddesses of the hours and seasons, keepers of order in time and guardians of the gates
  of Olympus. Logo: a dial with a gold hour and two columns (horae-dev/.github/brand). Night #15132B, cream
  #F3EEE4, gold #E9B14C.
- Voice: plain, precise, engineering-honest; says what is planned versus shipped.
