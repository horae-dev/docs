# Gmail

Rules-first Gmail triage that turns requests into tasks. `gmail.triage` reads the mail that
arrived since the last run, lets **your rules** decide each message (ignore it, make it a task,
or send it to the model), and returns only the undecided ones as data for the pipeline's `llm`
step, which runs the plugin's skill `gmail/triage-mail`. **The plugin never calls a model**, and
it never modifies, sends or deletes mail: both scopes it can use are read-only.

!!! note "Status"
    Version 0.4.0, listed in the marketplace. The skill's golden answers are hand-written, not a
    model's, and the wording of the tasks has not been judged by the maintainer yet. A
    `pack-mail-triage` (the pipeline and the skill as an installable pack) is proposed in the
    repository's `docs/`, not published.

## What it reads and writes

| Tool | Kind | Reads | Proposes |
|---|---|---|---|
| `gmail.recent` | source | the ids and `From`, `Subject`, `Date` headers of the latest messages; **no body** | nothing |
| `gmail.triage` | source | new mail of a label since the last run, with up to 16 KiB of the plain-text body | `task.create` for mail a rule made a task |

Skill: `gmail/triage-mail`, which proposes `task.create` for each real request among the mail no
rule decided.

Headers and bodies are untrusted text: they are made inert (control characters removed, Obsidian
Tasks signifiers and Markdown escaped) and capped before they reach any output.

## Permissions

From `plugin.yaml`:

| Kind | Value | Why |
|---|---|---|
| network | `gmail.googleapis.com` | the Gmail API |
| network | `oauth2.googleapis.com` | the token exchange |
| secrets | `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` | your own OAuth client and refresh token |
| intents | `task.create` | only `gmail.triage`, only for mail a rule made a task |
| paths | none declared | `gmail.triage` keeps its since-state in a file whose directory you grant (`paths.write`) |

## Install and configure

```sh
horae plugin add gmail@0.4.0 --allow-path /instance/state/gmail
```

1. **A Google Cloud project**, once: enable the Gmail API, an OAuth consent screen of type
   External, the scope `gmail.readonly` only (or `gmail.metadata` if you use only
   `gmail.recent`), and an OAuth client of type **Desktop app**.
2. **Publish the app to production.** An app left in "Testing" issues refresh tokens that expire
   after 7 days. For your own account an unverified app is enough; Google's verification is
   needed only to give the client to other people.
3. **Run the consent helper** on your machine, once. It prints the three secrets on stdout:

    ```sh
    umask 077
    GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... uv run python -m horae_gmail google-auth > gmail.env
    ```

4. Put each value in its secret file (`/run/secrets/GMAIL_CLIENT_ID` and so on, mode 600), and
   delete `gmail.env`.

## Rules

Deterministic, no LLM. The first rule that matches wins:

```yaml
rules:
  - name: promotions
    action: ignore                   # ignore | task | interpret
    label: [CATEGORY_PROMOTIONS]     # a label id or name
  - name: newsletters
    action: ignore
    list_id: ["*"]                   # has a List-Id header
  - name: bills
    action: task
    from: ["billing@orange.example"] # the address, never the display name
    subject: ["*invoice*", "*facture*"]
    task_prefix: "Pay: "
    due_in_days: 14
  - name: school
    action: interpret                # always to the model
    from: ["*@school.example.org"]
```

Matchers are case-insensitive globs (`*`, `?`, `[...]`), not regular expressions. A message no
rule matches goes to the model.

## Example pipeline

Adapted from the repository's [`examples/triage-mail.pipeline.yaml`](https://github.com/horae-dev/plugin-gmail/blob/main/examples/triage-mail.pipeline.yaml):

```yaml
name: triage-mail
trigger: { cron: "*/30 * * * *" }
steps:
  - collect:
      - gmail.triage:
          state_path: /instance/state/gmail/state.json   # in the directory granted with --allow-path
          account: mail
          account_index: 0                   # the Gmail account of the task links (/mail/u/0/)
          max_messages: 25
          rules:
            - { name: promotions, action: ignore, label: [CATEGORY_PROMOTIONS, CATEGORY_SOCIAL] }
            - { name: newsletters, action: ignore, list_id: ["*"] }
            - name: bills
              action: task
              from: ["billing@orange.example"]
              subject: ["*invoice*", "*facture*"]
              task_prefix: "Pay: "
              due_in_days: 14
            - { name: school, action: interpret, from: ["*@school.example.org"] }
  - llm:
      skill: gmail/triage-mail
      model: default
      budget: { usd: 0.05, tokens_out: 2000 }
      skip_when_empty: ["[].data.needs_interpretation"]   # rules decided everything: no call
      on_unchanged_input: skip
  - act:
      - obsidian.write_task: { mode: tasks, link_prefix: "https://mail.google.com/mail/u/0/" }
```

When your rules decide every message, `skip_when_empty` makes no model call and costs nothing.
`link_prefix` must cover `/mail/u/<account_index>/`.

## Repository

[horae-dev/plugin-gmail](https://github.com/horae-dev/plugin-gmail): labels, multiple accounts,
the since-state, failures and bounds in full.
