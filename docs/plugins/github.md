# GitHub

Your GitHub work as tasks and notes. Six read-only sources: review requests, assigned issues,
mentions and participating notifications become `task.create` intents, one per item; failing CI
on your repositories and pull requests, and what is new for you since your last action, become
data and, if you ask, one push per new event. The plugin never writes to GitHub.

!!! note "Status"
    Version 0.6.0, listed in the marketplace. All six sources work.

## What it reads and writes

| Source | Finds | Proposes |
|---|---|---|
| `github.review_requests` | open pull requests whose review is requested from you or a team you are in | `task.create` `Review owner/repo#42: <title>`, due the next business day |
| `github.assigned` | open issues and pull requests assigned to you | `task.create` `Work on ...`, due on the milestone's date |
| `github.mentions` | open issues and pull requests that mention you | `task.create` `Answer mention in ...`, due in 2 days |
| `github.notifications` | unread notifications you participate in | `task.create` by reason |
| `github.ci_failures` | default branches and your open pull requests whose head commit fails | data; one `notify.push` per new failure with `notify: true` |
| `github.updates` | issues and pull requests where someone else acted after your last action | data; one `notify.push` per new event with `notify: true` |

Every task carries its item's link. The core routes a linked task only to a `mode: tasks` entry
whose `link_prefix` covers it, so set the prefix to your GitHub owners, in their canonical case
(`https://github.com/Acme-Org/`). Titles from GitHub are untrusted and escaped.

## Permissions

From `plugin.yaml`:

| Kind | Value | Why |
|---|---|---|
| network | `api.github.com` | GraphQL and `GET /notifications`, the only host contacted |
| secret | `GITHUB_TOKEN` | a fine-grained, read-only token |
| optional secret | `GITHUB_NOTIFICATIONS_TOKEN` | a classic token with the `notifications` scope only, for `github.notifications` |
| intents | `task.create` | one task per item |
| intents | `notify.push` | `ci_failures` and `updates` with `notify: true` |
| paths | none | |

## Install and configure

```sh
horae plugin add github@0.6.0
```

Create a **fine-grained personal access token**: one resource owner (your account or an
organisation that approves it), the repositories you want, and these repository permissions, all
**read-only**: `Pull requests`, `Issues`, `Metadata`. Add `Contents` and `Commit statuses` for
`github.ci_failures` and `Contents` for `github.updates` on private repositories. Give it an
expiry (an organisation may require 366 days or less). Store it as `/run/secrets/GITHUB_TOKEN`.

The notifications API does not accept fine-grained tokens: `github.notifications` needs a
**classic** token with the `notifications` scope alone, in its own secret,
`GITHUB_NOTIFICATIONS_TOKEN`.

On a **private** repository a fine-grained token cannot read check runs: a failure is still
detected, reported with `checks_hidden: true` and without the check names.

## Example pipelines

In the [daily brief](pack-daily-brief.md), three sources feed the morning note:

```yaml
- collect:
    - github.review_requests: { today: "{{date}}", orgs: [Acme-Org], max_items: 20 }
    - github.assigned: { today: "{{date}}", orgs: [Acme-Org], max_items: 20, skip_covered: true }
    - github.mentions: { today: "{{date}}", orgs: [Acme-Org], max_items: 20, skip_covered: true }
- act:
    - obsidian.write_task: { mode: tasks, link_prefix: "https://github.com/Acme-Org/" }
```

And without a model, which repositories have a failing CI, as a note and a push per new failure
(from the repository's [`examples/ci-watch.yaml`](https://github.com/horae-dev/plugin-github/blob/main/examples/ci-watch.yaml)):

```yaml
name: ci-watch
trigger: { cron: "*/30 8-20 * * 1-5" }
steps:
  - collect:
      - github.ci_failures: { orgs: [Acme-Org], users: [ada], today: "{{date}}", notify: true }
  - transform:
      - obsidian.render_note:
          today: "{{date}}"
          block: ci-failures
          expect: [github.ci_failures]
          template: |
            # CI failures

            Updated ${date}.

            ## Alerts

            ${alerts}

            ## Failing

            ${github}
  - act:
      - obsidian.write_note: { path: "Horae/CI.assistant.md", mode: replace-owned }
  - notify:
      - ntfy.push:
          server: https://ntfy.invalid       # placeholder: your server
          topic: CHANGE-ME                   # placeholder: your topic
          tags: [rotating_light]
          link_prefix: "https://github.com/Acme-Org/"
          dedupe: "off"                      # keyed pushes: the core sends each key once
      - ntfy.push:
          server: https://ntfy.invalid
          topic: CHANGE-ME
          tags: [rotating_light]
          link_prefix: "https://github.com/ada/"
          dedupe: "off"
```

`Acme-Org` and `ada` are placeholders. One notify entry per owner, because a push with a link is
routed only to an entry whose `link_prefix` covers it. The repository also has
[`examples/updates.yaml`](https://github.com/horae-dev/plugin-github/blob/main/examples/updates.yaml),
a to-do of what is new for you.

## Repository

[horae-dev/plugin-github](https://github.com/horae-dev/plugin-github): every parameter, the data
shapes, fingerprints, hidden results (SAML, token lifetime) and failures.
