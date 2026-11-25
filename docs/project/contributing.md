# Contributing

Horae is built mostly by **AI coding agents, supervised by a human maintainer**. The rules below
apply to agents and humans alike. They are written down in each repository's `AGENTS.md`; the
core's is the reference: [horae/AGENTS.md](https://github.com/horae-dev/horae/blob/main/AGENTS.md).

## The most useful contributions now

Horae is pre-release. Issues and discussions are worth the most: use cases, plugin ideas, and
feedback on the core design. Open an issue before anything bigger than a typo. The
organisation's [contributing guide](https://github.com/horae-dev/.github/blob/main/CONTRIBUTING.md)
and [code of conduct](https://github.com/horae-dev/.github/blob/main/CODE_OF_CONDUCT.md) apply to
every repository.

Ground rules:

- **Predictability first.** A change that adds an LLM call, a network call or a new permission
  says why in the pull request.
- **Plugins declare everything.** Every host, secret, path and intent a plugin uses is in its
  `plugin.yaml`. Undeclared access is a bug.
- **No secrets, tokens, personal data or real hostnames** in code, tests or fixtures. Fixtures are
  synthetic. CI runs gitleaks.
- **Small pull requests, tests first.** Every acceptance criterion maps to at least one test.

## How work is organised

Work is tracked as issues, grouped into epics and milestones, on the
[roadmap project](https://github.com/orgs/horae-dev/projects/1). Each story has acceptance
criteria, an estimate and an **executor**:

| Executor | Who does it |
|---|---|
| Agent | an agent, end to end |
| Agent + human check | an agent, with a human verifying the result |
| Human-led | an agent drafts, the maintainer designs and reviews: open a draft PR with a short design note first, and wait |
| Human-only | the maintainer (accounts, keys, servers, device tests) |

A story is ready when it has the **`agent-ready`** label and its dependencies are done. Pick one
issue at a time. If anything is ambiguous, ask in the issue instead of guessing: unclear specs
are the first cause of wasted agent work.

Security-critical code (permissions, sandboxing, signed links, secrets) is where agent-written
code fails most and mistakes cost most, so those stories are human-led, and the malicious-plugin
suite runs in CI. This is one of the project's tracked risks: see the
[roadmap](roadmap.md#burning-points).

## Branches, commits and provenance

- One branch per issue, `story/<issue-number>-<short-slug>`, one pull request per issue, under
  about 400 changed lines when possible.
- Every commit made by an agent carries **Graft trailers** in its last paragraph, so the history
  says which agent, which model and which task produced it:

  ```text
  Graft-Agent: claude-code
  Graft-Model: <model id>
  Graft-Task: #<issue number>
  ```

  In the core, set `GRAFT_AGENT`, `GRAFT_MODEL` and `GRAFT_TASK` before committing, and the
  `commit-msg` hook installed by `uv run pre-commit install` adds them.

## Review

[Graft](https://github.com/mmornati/graft) posts an **intent card** on each pull request, checks
it against the diff, and applies the repository's `graft.yaml`:

- trivial and small low-risk changes can be approved without a human;
- changes to sensitive paths (permissions, the plugin host, the marketplace client, `/act`, LLM
  backends, secrets, schemas, the SDK, workflows, the Dockerfile, deploy templates, the threat
  model, dependency locks), large changes, and anything Graft rates `sensitive` need the
  maintainer.

Address review comments in new commits; do not force-push over reviewed commits.

## Definition of done

- All acceptance criteria met and checked in the pull request.
- CI green: the aggregate **CI OK** check (lint, types, tests with an 85% coverage gate, security
  scans).
- Commits carry the Graft trailers.
- Docs and examples updated if behaviour changed.
- No new undeclared permission, secret or LLM call.
- On the issue, the **actuals**: agent attempts, wall-clock time, whether a human took over. They
  feed the recalibration of the
  [estimation](https://github.com/horae-dev/horae/blob/main/docs/ESTIMATION.md).

## Setting up the core

```sh
git clone https://github.com/horae-dev/horae.git
cd horae
uv sync
uv run pre-commit install      # pre-commit and commit-msg hooks
uv run ruff check && uv run ruff format --check
uv run mypy                    # strict
uv run pytest --cov            # tests and the coverage gate
```

Writing a plugin instead? Start from the [template](../plugins/template.md) and read
[Writing a plugin](../plugins/writing-a-plugin.md).

## Reporting a vulnerability

**Do not open a public issue.** Use GitHub's private vulnerability reporting on the affected
repository (for the core: [horae-dev/horae](https://github.com/horae-dev/horae/security),
**Security**, then **Report a vulnerability**). The policy is the organisation's
[`SECURITY.md`](https://github.com/horae-dev/.github/blob/main/SECURITY.md).
