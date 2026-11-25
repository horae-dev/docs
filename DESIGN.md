---
name: Horae
description: The documentation of a predictable personal agent, presented as a 24-hour dial.
colors:
  night: "#15132b"
  night-deep: "#0e0c1f"
  ink: "#1d1a3a"
  ink-2: "#29254a"
  line: "#3a3560"
  cream: "#f3eee4"
  cream-dim: "#c8c1d3"
  paper: "#faf6ee"
  gold: "#e9b14c"
  gold-hi: "#f6cf7e"
  gold-deep: "#9a6512"
  ember: "#d9783b"
  leaf: "#a6d6a8"
typography:
  display: { fontFamily: "Cormorant", fontWeight: 600, fontSize: "clamp(3rem, 6.4vw, 5.8rem)", lineHeight: 0.94, fontVariantNumeric: lining-nums }
  section: { fontFamily: "Cormorant", fontWeight: 600, fontSize: "clamp(2.3rem, 4.6vw, 3.8rem)", lineHeight: 1 }
  body: { fontFamily: "Hanken Grotesk", fontWeight: 400, fontSize: "1.06rem", lineHeight: 1.6 }
  docs-body: { fontFamily: "Hanken Grotesk", fontSize: "0.82rem", lineHeight: 1.7 }
  code: { fontFamily: "JetBrains Mono", fontSize: "0.8rem", lineHeight: 1.75 }
rounded: { pill: "999px", panel: "16px", code: "4px" }
spacing: { gutter: "clamp(1rem, 4vw, 3.5rem)", section: "clamp(4.5rem, 10vw, 8rem)", container: "78rem" }
---

# Design System: Horae

## North star: "The Hours Dial"

The reader's day is a 24-hour dial: sunrise on the left, noon at the top, sunset on the right, Roman numerals
every three hours. Pipelines are points at their hour. Gold marks the hour hand, the one LLM step and anything
that asks for attention; cream is text and structure; the sky is night ink that warms to ember at dawn.

## Signature moment

"A day with Horae" (landing): a sticky stage, 560vh tall. Scrolling turns the hand from 06:00 to 23:00, warms
the sky (`--dawn`), lights each pipeline at its hour and shows its run record (steps, dry-run, journal, cost).
It is the only scroll-driven motion on the site.

## Rules

- Display and section titles in Cormorant 600, italic 500 in gold for the emphasised words; always lining
  numerals (Cormorant defaults to old-style, which reads `0.6.0` as `o.6.o`). Never digits in the serif on canvas.
- Body in Hanken Grotesk; JetBrains Mono only for code, commands, run records and data.
- Lists of things are editorial rows separated by hairlines, not card grids; no eyebrow labels; no gradient text.
- Pills for steps and states; `llm` is always outlined in gold, a skipped step is struck through.
- Docs pages: cream paper "day" theme and ink "night" theme; links gold-brown on paper, gold on ink.
- Videos share the same world through `docs/videos/horae/horae.js` (sky, dial, mark, steps, permission card).
- Nothing loaded from a third party.
