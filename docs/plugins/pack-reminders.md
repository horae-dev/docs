# Reminders (pack)

Reminders without a model. Every five minutes the `remind` pipeline reads your open Obsidian
tasks and pushes them through ntfy:

- **`⏰` reminders** at their time: `- [ ] Call the plumber 📅 2026-11-09 ⏰ 14:30` sends
  `⏰ 2026-11-09 14:30` / `Call the plumber` at 14:30;
- **a morning digest** at 07:00: how many tasks are overdue and the oldest of them, then today's
  tasks by reminder time, then the rest due today;
- **one overdue nudge** at 09:00 for each task that became overdue yesterday (older ones appear
  only in the digest);
- **nothing during quiet hours** (22:00 to 07:00): a push is delayed to 07:00.

A ticked `[x]` or cancelled `[-]` task never reminds; a snoozed task waits for its snooze to
end. **No run ever calls a model**: the pipeline has no `llm` step.

!!! warning "Status"
    Tagged `v0.1.1`, but **not listed in the marketplace** (it has no `horae plugin add` entry
    yet). The transform it needs, plugin-obsidian's `obsidian.reminders`, is released in
    obsidian 0.2.x. The pack's tests run the pipeline through the core's `Runner` with
    plugin-obsidian's real parser and transform and a stand-in of `ntfy.push`.

## What is in the pack

| File | What it is |
|---|---|
| `plugin.yaml` | provides the pipeline `remind`; asks for no permission |
| `pipelines/remind.yaml` | `collect` → `transform` → `notify`, cron `*/5 * * * *` |

## Permissions

From `plugin.yaml`: **none** (`permissions: {}`). The pack proposes nothing itself: the
`notify.push` intents come from the `obsidian.reminders` transform and are applied by plugin-ntfy.

## The pipeline

```yaml
name: remind
trigger: { cron: "*/5 * * * *" }
steps:
  - collect:
      - obsidian.open_tasks: { limit: 2000 }
  - transform:
      - obsidian.reminders:
          now: "{{now}}"
          timezone: "{{timezone}}"
          window_minutes: 60
          digest_at: "07:00"
          overdue_at: "09:00"
          overdue_for_minutes: 60
          max_overdue: 10
          quiet_hours: { start: "22:00", end: "07:00" }
  - notify:
      - ntfy.push:
          server: https://ntfy.invalid     # placeholder: set your server
          topic: CHANGE-ME                 # placeholder: set an unguessable topic
          priority: high
          tags: [alarm_clock]
          quiet_hours: { start: "22:00", end: "07:00", during: delay }
          dedupe: daily
```

**The lookback.** Every run proposes what falls in the last 60 minutes, so a reminder reaches the
phone at the first run at or after its time (at most four minutes late), and a missed run is
caught up by the next one. The repeats are dropped by plugin-ntfy's `dedupe: daily`.
`window_minutes` must be at least the cron interval.

## Install

Until it is listed, by hand:

1. Copy `pipelines/remind.yaml` into your instance's `pipelines/`. Replace the placeholders
   `https://ntfy.invalid` and `CHANGE-ME`: as shipped they fail, so an unedited copy never pushes
   anywhere.
2. Install [obsidian](obsidian.md) (the vault granted) and [ntfy](ntfy.md), with **a state
   directory granted to ntfy** (`--allow-path`): `dedupe: daily` needs it.
3. Set `timezone` in `horae.yaml`: the reminders, the digest and quiet hours are local times.
4. Run it with `horae serve`, or an external scheduler every five minutes (`horae run remind`),
   with a push monitor (`scheduler.monitors.remind`).

## Known gaps

- A missed run longer than the lookback is a missed reminder: the scheduler never catches up a
  missed fire time. The push monitor is what reports it.
- A task whose key is not unique (a copy-pasted line) is withheld and never reminds; the digest
  then says "Some tasks could not be read".
- The pack's pushes carry no link and no Done / Snooze buttons (listed as a gap in its README).
- Wording is English, with ISO dates.
- The `⏳` scheduled and `🛫` start dates are not used.

## Repository

[horae-dev/pack-reminders](https://github.com/horae-dev/pack-reminders): the full rules
(daylight saving, quiet hours, duplicate text, the digest's size limit).
