/* A morning with Horae (engine: ../engine/engine.js, world: ../horae/horae.js).
 * Scenes are pure functions of t; animations hang on the spoken sentences (at(cues, i)).
 * Events, tasks, costs and the run id are fictional demo data, labelled on screen.
 */
"use strict";

const STR = {
  en: {
    demo: "demo data", sleeping: "nothing spent while nothing is due",
    h_collect: "Collect.", cal: "calendars", vault: "vault", gh: "GitHub",
    ev: ["09:30  Stand-up", "16:00  Dentist", "18:30  Swimming, Léa"], tasks: ["Renew passport", "Pay school canteen", "Call the plumber"], rv: ["review horae#212", "review docs#4"],
    h_llm: "One model call.", schema: "schema ok", budget: "budget", spent: "spent",
    h_diff: "The diff, before the write.", owned: "owned block only", untouched: "your own notes: untouched",
    h_note: "The note, and a nudge.", today: "Today", push: "3 things before 10:00", open: "Open", snooze: "Snooze",
    diff: ["  # Wednesday 25 November", "  <!-- horae:daily-brief -->", "+ 1. Dentist at 16:00", "+ 2. Pay school canteen", "+ 3. Review horae#212", "  <!-- /horae:daily-brief -->", "  my own notes…"],
    h_undo: "Every run, journaled.", restored: "restored byte for byte",
    bye: "Good morning.",
  },
  fr: {
    demo: "données de démo", sleeping: "rien n'est dépensé tant que rien n'est dû",
    h_collect: "Collecter.", cal: "agendas", vault: "coffre", gh: "GitHub",
    ev: ["09:30  Point d'équipe", "16:00  Dentiste", "18:30  Piscine, Léa"], tasks: ["Renouveler le passeport", "Payer la cantine", "Appeler le plombier"], rv: ["review horae#212", "review docs#4"],
    h_llm: "Un seul appel au modèle.", schema: "schéma ok", budget: "budget", spent: "dépensé",
    h_diff: "Le diff, avant l'écriture.", owned: "seulement le bloc possédé", untouched: "vos notes : intactes",
    h_note: "La note, et un rappel.", today: "Aujourd'hui", push: "3 choses avant 10:00", open: "Ouvrir", snooze: "Reporter",
    diff: ["  # Mercredi 25 novembre", "  <!-- horae:daily-brief -->", "+ 1. Dentiste à 16:00", "+ 2. Payer la cantine", "+ 3. Review horae#212", "  <!-- /horae:daily-brief -->", "  mes propres notes…"],
    h_undo: "Chaque exécution, journalisée.", restored: "restaurée à l'octet près",
    bye: "Bonjour.",
  },
};

/* The scene's clock: a small dial in the top right, its hand at hour h. */
function corner(t, h, k = 1) {
  dial(1110, 130, 70, { k, numerals: false, h, from: 5.5, t });
  text(`${String(Math.floor(h)).padStart(2, "0")}:${String(Math.floor((h % 1) * 60)).padStart(2, "0")}`, 1110, 245, { size: 18, font: MONO, color: HR.goldHi, align: "center", alpha: k });
}
function demo(k = 1) { text(S.demo, 1200, 690, { size: 12, font: MONO, color: HR.faint, align: "right", alpha: k }); }

/* 1. Five thirty: the dial in the dark, the pipeline waking. */
function sNight(t, d, cues) {
  const a1 = at(cues, 1, 2.5);
  const h = 5 + 0.5 * outCubic(seg(t, 0.3, 2.2));
  dial(640, 340, 210, { k: seg(t, 0, 1.4), h, from: 5, t, pips: [{ h: 5.5, label: "daily-brief", lr: 0.42, on: t > a1 }] });
  text(`${t > 2.2 ? "05:30" : "05:" + String(Math.floor((h - 5) * 60)).padStart(2, "0")}`, 640, 660, { size: 26, font: MONO, color: HR.goldHi, align: "center", alpha: seg(t, 0.4, 1) });
  text(S.sleeping, 640, 690, { size: 14, font: MONO, color: HR.faint, align: "center", alpha: seg(t, 0.6, 1.2) * (1 - seg(t, a1, a1 + 0.5)) });
}

/* 2. Collect: three sources fan in. */
function sCollect(t, d, cues) {
  corner(t, 5.5 + t / 600);
  title(S.h_collect, seg(t, 0.1, 0.7));
  const cols = [
    { name: S.cal, items: S.ev, tool: "calendar.events", a: 0.4 },
    { name: S.vault, items: S.tasks, tool: "obsidian.open_tasks", a: at(cues, 1, 3) },
    { name: S.gh, items: S.rv, tool: "github.review_requests", a: at(cues, 2, 5.5) },
  ];
  cols.forEach((c, i) => {
    const x = 80 + i * 300, k = seg(t, c.a, c.a + 0.6);
    panel(x, 220, 270, 230, { r: 14, fill: HR.ink, stroke: HR.line, alpha: k });
    text(c.name, x + 20, 256, { size: 26, weight: 600, font: SERIF, color: HR.cream, alpha: k });
    text(c.tool, x + 20, 282, { size: 13, font: MONO, color: HR.gold, alpha: k });
    c.items.forEach((s, j) => text(s, x + 20, 325 + j * 34, { size: 16, font: SANS, color: HR.dim, alpha: seg(t, c.a + 0.3 + j * 0.15, c.a + 0.6 + j * 0.15) }));
    packets(x + 135, 455, 640, 560, t, { n: 3, period: 1.6, color: HR.gold, r: 3, alpha: seg(t, c.a + 0.5, c.a + 1) });
  });
  step("collect", 640, 575, { kind: "active", size: 18, align: "center", alpha: seg(t, 0.4, 0.9) });
  demo(seg(t, 0.5, 1));
}

/* 3. One model call, a schema check and a budget gauge. */
function sLlm(t, d, cues) {
  const a1 = at(cues, 1, 3.5);
  corner(t, 5.52 + t / 600);
  title(S.h_llm, seg(t, 0.1, 0.7));
  stepRow([{ s: "collect" }, { s: "llm", kind: "llm" }, { s: "act" }, { s: "notify" }], 80, 230, [1, 1, 1, 1].map((_, i) => seg(t, 0.2 + i * 0.1, 0.5 + i * 0.1)), { size: 18 });
  // items flow into the step and come out ranked
  const ranked = [S.ev[1], S.tasks[1], S.rv[0], S.ev[0], S.tasks[0]];
  ranked.forEach((s, i) => {
    const k = seg(t, 0.8 + i * 0.25, 1.4 + i * 0.25);
    text(`${i + 1}.`, 120, 320 + i * 40, { size: 18, font: MONO, color: HR.gold, alpha: k });
    text(s, 160, 320 + i * 40, { size: 20, font: SANS, color: i < 3 ? HR.cream : HR.dim, alpha: k });
  });
  const kS = seg(t, a1, a1 + 0.5);
  pill(S.schema, 760, 330, { align: "left", size: 17, font: MONO, fill: HR.night, stroke: HR.leaf, color: HR.leaf, alpha: kS });
  check(930, 330, 14, HR.leaf, kS);
  // budget gauge: spent $0.004 of $0.15 (demo)
  const kB = seg(t, a1 + 0.6, a1 + 1.2);
  text(S.budget + "  $0.15", 760, 400, { size: 16, font: MONO, color: HR.dim, alpha: kB });
  panel(760, 418, 420, 14, { r: 7, fill: HR.ink, stroke: HR.line, alpha: kB });
  panel(760, 418, Math.max(14, 420 * (0.004 / 0.15) * outCubic(seg(t, a1 + 0.9, a1 + 2))), 14, { r: 7, fill: HR.gold, stroke: false, alpha: kB });
  text(S.spent + "  $0.004", 760, 462, { size: 16, font: MONO, color: HR.goldHi, alpha: seg(t, a1 + 1.4, a1 + 2) });
  demo(seg(t, 0.5, 1));
}

/* 4. The diff before the write: one owned block. */
function sDryrun(t, d, cues) {
  const a1 = at(cues, 1, 3);
  corner(t, 5.53 + t / 600);
  title(S.h_diff, seg(t, 0.1, 0.7));
  terminal(80, 200, 700, 110, t, [{ p: "$ ", s: "horae run daily-brief --dry-run", a: 0.4, b: 1.4 }], { title: "horae", size: 18, lh: 32 });
  const kN = seg(t, 1.6, 2.2);
  panel(80, 340, 700, 290, { r: 12, fill: HR_THEME.term, stroke: HR.line, alpha: kN });
  text("vault/Daily/2026-11-25.assistant.md", 100, 370, { size: 14, font: MONO, color: HR.faint, alpha: kN });
  const lines = S.diff;
  lines.forEach((s, i) => {
    const add = s.startsWith("+"), k = seg(t, 1.8 + i * 0.15, 2.1 + i * 0.15);
    text(s, 100, 408 + i * 30, { size: 16, font: MONO, color: add ? HR.leaf : HR.dim, alpha: k });
  });
  const kO = seg(t, a1, a1 + 0.6);
  highlight(90, 430, 680, 128, kO, HR.gold);
  pill(S.owned, 820, 480, { align: "left", size: 17, font: SANS, fill: HR.night, stroke: HR.gold, color: HR.goldHi, alpha: kO });
  pill(S.untouched, 820, 588, { align: "left", size: 17, font: SANS, fill: HR.night, stroke: HR.line, color: HR.dim, alpha: seg(t, a1 + 0.8, a1 + 1.4) });
  demo(seg(t, 0.5, 1));
}

/* 5. The note in the vault, the push on the phone. */
function sNote(t, d, cues) {
  const a1 = at(cues, 1, 3);
  hrDawnM(t, 0, d, 0.5);
  title(S.h_note, seg(t, 0.1, 0.7));
  const kN = seg(t, 0.3, 1.0);
  panel(80, 200, 560, 400, { r: 14, fill: HR.paper, stroke: false, shadow: true, alpha: kN });
  text("2026-11-25.assistant.md", 104, 236, { size: 14, font: MONO, color: "#8b849c", alpha: kN });
  text(S.today, 104, 290, { size: 38, weight: 700, font: SERIF, color: HR.paperInk, alpha: kN });
  [S.ev[1], S.tasks[1], S.rv[0]].forEach((s, i) => {
    const k = seg(t, 0.8 + i * 0.25, 1.2 + i * 0.25);
    ring(116, 337 + i * 46, 9, "#7a4c06", 1.5, k);
    text(s, 140, 344 + i * 46, { size: 21, font: SANS, color: HR.paperInk, alpha: k });
  });
  // phone
  const kP = seg(t, a1, a1 + 0.7), py = 160 + (1 - outCubic(kP)) * 40;
  panel(820, py, 300, 470, { r: 36, fill: HR.night2, stroke: HR.line, lw: 2, alpha: kP });
  text("07:02", 970, py + 80, { size: 44, font: SANS, weight: 300, color: HR.cream, align: "center", alpha: kP });
  const kM = seg(t, a1 + 0.6, a1 + 1.2);
  panel(840, py + 130, 260, 150, { r: 16, fill: HR.ink2, stroke: HR.line, alpha: kM });
  text("ntfy · horae", 858, py + 158, { size: 13, font: MONO, color: HR.faint, alpha: kM });
  text(S.push, 858, py + 190, { size: 19, font: SANS, weight: 600, color: HR.cream, alpha: kM });
  pill(S.open, 858, py + 240, { align: "left", size: 15, font: SANS, fill: HR.gold, stroke: HR.gold, color: HR.night, alpha: seg(t, a1 + 1.2, a1 + 1.6) });
  pill(S.snooze, 958, py + 240, { align: "left", size: 15, font: SANS, fill: HR.night, stroke: HR.line, color: HR.dim, alpha: seg(t, a1 + 1.4, a1 + 1.8) });
  demo(seg(t, 0.5, 1));
}

/* 6. Undo: the journal, then the note restored. */
function sUndo(t, d, cues) {
  const a1 = at(cues, 1, 2);
  corner(t, 7.1 + t / 60);
  title(S.h_undo, seg(t, 0.1, 0.7));
  terminal(80, 190, 1120, 270, t, [
    { p: "$ ", s: "horae runs", a: 0.4, b: 1.0 },
    { p: "", s: "RUN                                    PIPELINE     STATUS  COST", a: 1.2, c: HR.faint },
    { p: "", s: "20261125T053000Z-daily-brief-3e0db3    daily-brief  ok      $0.0040", a: 1.4, c: HR.cream },
    { p: "$ ", s: "horae undo 20261125T053000Z-daily-brief-3e0db3", a: a1 + 0.4, b: a1 + 1.4 },
    { p: "", s: "Run 20261125T053000Z-daily-brief-3e0db3 (daily-brief): undone", a: a1 + 1.7, c: HR.leaf },
  ], { title: "horae", size: 17, lh: 34 });
  const k = seg(t, a1 + 2, a1 + 2.6);
  check(110, 500, 18, HR.leaf, k);
  text(S.restored, 140, 507, { size: 26, weight: 600, font: SERIF, color: HR.cream, alpha: k });
  demo(seg(t, 0.5, 1));
}

/* 7. Outro: sunrise on the dial. */
function sOutro(t, d, cues) {
  hrDawnM(t, 0, 2.5, 0.9);
  const h = 6 + 1.3 * outCubic(seg(t, 0, d));
  dial(640, 330, 200, { k: 1, h, from: 5.5, t, pips: [{ h: 5.5, label: "daily-brief", lr: 0.5, done: true }, { h: 6.5, label: "school-fr", lr: 0.45, on: h > 6.5 }, { h: 8.5, label: "gmail-triage" }] });
  text(S.bye, 640, 650, { size: 44, weight: 600, font: SERIF, color: HR.goldHi, align: "center", alpha: seg(t, 0.6, 1.3) });
}

function hrDawnM(t, a, b, max) {
  const k = seg(t, a, b) * max;
  if (k <= 0) return;
  ctx.save();
  const e = ctx.createRadialGradient(W * 0.72, H * 1.15, 20, W * 0.72, H * 1.15, W * 0.75);
  e.addColorStop(0, `rgba(217,120,59,${0.55 * k})`); e.addColorStop(0.45, `rgba(233,177,76,${0.22 * k})`); e.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = e; ctx.fillRect(0, 0, W, H); ctx.restore();
}

VIDEO.create({
  title: { en: "A morning with Horae", fr: "Une matinée avec Horae" },
  kicker: { en: "Horae · narrated tour", fr: "Horae · visite commentée" },
  langs: ["en", "fr"],
  theme: HR_THEME,
  strings: STR,
  background: () => hrSky(0),
  fonts: HR_FONTS,
  poster: "note",
  scenes: { night: sNight, collect: sCollect, llm: sLlm, dryrun: sDryrun, note: sNote, undo: sUndo, outro: sOutro },
});
