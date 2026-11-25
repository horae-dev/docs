/* Horae in 90 seconds (engine: ../engine/engine.js, world: ../horae/horae.js).
 * Scenes are pure functions of t; animations hang on the spoken sentences (at(cues, i)).
 * The commit hash and costs shown are illustrative and labelled as examples on screen.
 */
"use strict";

const STR = {
  en: {
    model: "model", tools: ["mail", "calendar", "bank", "web", "shell", "school"],
    calls: "calls", why: "why this call?",
    tagline: "A predictable, self-hosted personal agent.",
    h_pipe: "Every job is a pipeline.", written: "written down · read · tested",
    h_llm: "The model is a typed function.",
    f_skill: "skill", f_schema: "output", f_model: "model", f_budget: "budget", f_tools: "tools",
    v_tools: "none", same: "same input  →  no call  ·  $0",
    h_int: "Plugins propose. The core applies.", plugin: "plugin", core: "Horae core",
    dry: "dry-run diff", journal: "journal", undo: "horae undo",
    h_perm: "Permissions you can read.",
    perm_desc: "Review requests, assignments and mentions as tasks.",
    lock: "horae.lock", lock_line: "github  0.6.0  commit 3f9c2e1… (example)", noupdate: "nothing updates itself",
    h_models: "Bring your own model.",
    m: ["Anthropic API", "claude -p", "OpenAI-compatible", "Ollama"],
    pre: "open source · pre-release · Apache-2.0", day: "Your day, kept in order.", url: "horae-dev.github.io/docs",
    ask: "Approve these permissions?",
  },
  fr: {
    model: "modèle", tools: ["mail", "agenda", "banque", "web", "shell", "école"],
    calls: "appels", why: "pourquoi cet appel ?",
    tagline: "Un agent personnel prévisible, auto-hébergé.",
    h_pipe: "Chaque tâche est un pipeline.", written: "écrit · lu · testé",
    h_llm: "Le modèle, une fonction typée.",
    f_skill: "skill", f_schema: "sortie", f_model: "modèle", f_budget: "budget", f_tools: "outils",
    v_tools: "aucun", same: "même entrée  →  aucun appel  ·  0 $",
    h_int: "Les plugins proposent. Le cœur applique.", plugin: "plugin", core: "cœur Horae",
    dry: "diff à blanc", journal: "journal", undo: "horae undo",
    h_perm: "Des permissions lisibles.",
    perm_desc: "Revues, assignations et mentions en tâches.",
    lock: "horae.lock", lock_line: "github  0.6.0  commit 3f9c2e1… (exemple)", noupdate: "rien ne se met à jour tout seul",
    h_models: "Apportez votre modèle.",
    m: ["API Anthropic", "claude -p", "compatible OpenAI", "Ollama"],
    pre: "open source · pré-version · Apache-2.0", day: "Votre journée, mise en ordre.", url: "horae-dev.github.io/docs",
    ask: "Approuver ces permissions ?",
  },
};

/* Dawn glow drawn over the sky for a scene: ramps to `max` between a and b. */
function hrDawn(t, a, b, max) {
  const k = seg(t, a, b) * max;
  if (k <= 0) return;
  ctx.save();
  const e = ctx.createRadialGradient(W * 0.72, H * 1.15, 20, W * 0.72, H * 1.15, W * 0.75);
  e.addColorStop(0, `rgba(217,120,59,${0.55 * k})`); e.addColorStop(0.45, `rgba(233,177,76,${0.22 * k})`); e.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = e; ctx.fillRect(0, 0, W, H); ctx.restore();
}

/* 1. The agent loop: a model in the middle, calling tools in an order nobody wrote down. */
function sHook(t, d, cues) {
  const a1 = at(cues, 1, 3), a2 = at(cues, 2, 6);
  const cx = 640, cy = 360, r = 230;
  const tools = S.tools;
  const k0 = seg(t, 0.2, 1.2);
  tools.forEach((name, i) => {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / tools.length;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.82;
    pill(name, x, y, { align: "center", size: 17, font: SANS, fill: HR.ink, stroke: t > a2 ? HR.red : HR.line, color: HR.dim, alpha: seg(t, 0.3 + i * 0.1, 0.8 + i * 0.1) });
  });
  const steps = Math.max(0, (t - a1) / 0.45);
  const n = Math.floor(steps);
  if (t > a1) for (let j = Math.max(0, n - 3); j <= n; j++) {
    const R = rng(1000 + j), i = Math.floor(R() * tools.length);
    const a = -Math.PI / 2 + (i * Math.PI * 2) / tools.length;
    const x = cx + Math.cos(a) * r * 0.78, y = cy + Math.sin(a) * r * 0.64;
    const k = j === n ? steps - n : 1;
    arrow(cx, cy, x, y, outCubic(clamp(k * 1.6)), j === n ? HR.gold : HR.line);
  }
  dot(cx, cy, 56 * outBack(k0), HR.ink2);
  ring(cx, cy, 56 * outBack(k0), HR.gold, 2, k0);
  text(S.model, cx, cy + 7, { size: 22, font: MONO, color: HR.goldHi, align: "center", alpha: k0 });
  text(`${n} ${S.calls}`, 1200, 670, { size: 18, font: MONO, color: HR.dim, align: "right", alpha: seg(t, a1, a1 + 0.5) });
  if (t > a2) text(S.why, cx, cy + 105, { size: 30, font: SERIF, weight: 600, color: HR.red, align: "center", alpha: seg(t, a2, a2 + 0.6) });
}

/* 2. Horae: the mark, the name, the promise. */
function sIntro(t, d, cues) {
  hrDawn(t, 0, d, 0.25);
  mark(640, 250, 230, seg(t, 0.2, 1.8));
  text("Horae", 640, 450, { size: 96, weight: 600, font: SERIF, color: HR.cream, align: "center", alpha: seg(t, 0.8, 1.5) });
  const a1 = at(cues, 1, 2.2);
  text(S.tagline, 640, 505, { size: 26, font: SANS, color: HR.dim, align: "center", alpha: seg(t, a1, a1 + 0.6) });
}

/* 3. The pipeline: YAML on the left, the steps lighting up in order. */
const YAML = [
  ["name: ", "daily-brief"], ["trigger: ", "{ cron: \"30 5 * * *\" }"], ["steps:", ""],
  ["  - collect: ", "[calendar, obsidian, github]"], ["  - rules: ", "[skip_covered]"],
  ["  - llm: ", "{ skill: rank-and-word }"], ["  - act: ", "[obsidian.write_note]"], ["  - notify: ", "[ntfy.push]"],
];
function sPipeline(t, d, cues) {
  const a1 = at(cues, 1, 3), a2 = at(cues, 2, 6);
  title(S.h_pipe, seg(t, 0.1, 0.8));
  const kP = seg(t, 0.2, 0.6);
  panel(80, 200, 500, 300, { r: 14, fill: HR_THEME.term, stroke: HR.line, alpha: kP });
  text("pipelines/daily-brief.yaml", 104, 232, { size: 13, font: MONO, color: HR.faint, alpha: kP });
  YAML.forEach(([k, v], i) => {
    const kk = seg(t, 0.4 + i * 0.18, 0.7 + i * 0.18);
    text(k, 104, 272 + i * 28, { size: 16, font: MONO, color: HR.goldHi, alpha: kk });
    text(v, 104 + measure(k, 16, 400, MONO), 272 + i * 28, { size: 16, font: MONO, color: HR.cream, alpha: kk });
  });
  const names = ["collect", "rules", "llm", "act", "notify"];
  const ks = names.map((_, i) => seg(t, a1 + i * 0.35, a1 + i * 0.35 + 0.4));
  const active = t > a1 ? Math.floor((t - a1) / 0.35) : -1;
  const steps = names.map((s, i) => ({ s, kind: i === active ? "active" : s === "llm" ? "llm" : undefined }));
  stepRow(steps, 640, 350, ks, { size: 16, gap: 26 });
  const k2 = seg(t, a2, a2 + 0.8);
  if (k2 > 0) {
    line(partial([[640, 400], [1190, 400]], outCubic(k2)), HR.gold, 1.5, 0.8, [6, 6]);
    text(S.written, 640, 444, { size: 26, font: SERIF, weight: 600, color: HR.goldHi, alpha: k2 });
  }
}

/* 4. The bounded LLM step, as a typed function. */
function sLlm(t, d, cues) {
  const a1 = at(cues, 1, 2.5), a2 = at(cues, 2, 6.5);
  title(S.h_llm, seg(t, 0.1, 0.8));
  const x = 300, y = 200, w = 680, h = 310;
  const k = outCubic(seg(t, 0.3, 1.0));
  panel(x, y, w, h * k, { r: 18, fill: "rgba(233,177,76,0.07)", stroke: HR.gold, lw: 1.5, alpha: k });
  step("llm", x + 30, y + 40, { kind: "llm", size: 18, alpha: k });
  const rows = [[S.f_skill, "daily-brief/rank-and-word"], [S.f_schema, "JSON Schema  · validated"], [S.f_model, "default  (alias)"], [S.f_budget, "$0.15 · 4000 tokens out"], [S.f_tools, S.v_tools]];
  rows.forEach(([a, b], i) => {
    const kk = seg(t, a1 + i * 0.3, a1 + i * 0.3 + 0.4);
    text(a, x + 40, y + 104 + i * 40, { size: 18, font: MONO, color: HR.dim, alpha: kk });
    text(b, x + 200, y + 104 + i * 40, { size: 18, font: MONO, weight: i === 4 ? 700 : 400, color: i === 4 ? HR.goldHi : HR.cream, alpha: kk });
  });
  const k3 = seg(t, a2, a2 + 0.6);
  if (k3 > 0) pill(S.same, 640, 570, { align: "center", size: 18, font: MONO, fill: HR.night, stroke: HR.leaf, color: HR.leaf, alpha: k3 });
}

/* 5. Intents: the plugin proposes, the core shows the diff, journals it, and can undo it. */
function sIntents(t, d, cues) {
  const a1 = at(cues, 1, 2.5), a2 = at(cues, 2, 5);
  title(S.h_int, seg(t, 0.1, 0.8));
  const kP = seg(t, 0.3, 0.9);
  panel(80, 290, 200, 110, { r: 14, fill: HR.ink, stroke: HR.line, alpha: kP });
  text(S.plugin, 180, 352, { size: 22, font: MONO, color: HR.cream, align: "center", alpha: kP });
  const kx = seg(t, 0.8, 1.4);
  cross(120, 440, 14, HR.red, kx);
  text("write()", 142, 446, { size: 15, font: MONO, color: HR.faint, alpha: kx });
  ["note.replace_owned_block", "task.create"].forEach((s, i) => {
    const k = seg(t, a1 + i * 0.4, a1 + i * 0.4 + 1.0);
    pill(s, lerp(300, 420, outCubic(k)), 310 + i * 60, { align: "left", size: 14, font: MONO, fill: HR.night, stroke: HR.gold, color: HR.goldHi, alpha: k });
  });
  const kC = seg(t, a1, a1 + 0.6);
  panel(700, 260, 220, 170, { r: 14, fill: HR.ink2, stroke: HR.gold, alpha: kC });
  text(S.core, 810, 352, { size: 26, weight: 600, font: SERIF, color: HR.cream, align: "center", alpha: kC });
  const kD = seg(t, a2, a2 + 0.6), kJ = seg(t, a2 + 1.0, a2 + 1.6), kU = seg(t, a2 + 2.2, a2 + 2.8);
  arrow(930, 345, 990, 345, kD, HR.line);
  panel(1000, 220, 200, 260, { r: 12, fill: HR_THEME.term, stroke: HR.line, alpha: kD });
  text(S.dry, 1016, 248, { size: 13, font: MONO, color: HR.faint, alpha: kD });
  const undone = seg(t, a2 + 2.8, a2 + 3.6);
  ["+ ## Today", "+ - [ ] review #212", "+ - [ ] dentist 16:00"].forEach((s, i) => {
    text(s, 1016, 284 + i * 26, { size: 14, font: MONO, color: HR.leaf, alpha: kD * (1 - undone * 0.85) });
  });
  pill(S.journal + " #8812", 1016, 400, { align: "left", size: 13, font: MONO, fill: HR.night, stroke: HR.line, color: HR.dim, alpha: kJ });
  pill(S.undo + " 8812", 1016, 445, { align: "left", size: 13, font: MONO, fill: undone > 0 ? HR.gold : HR.night, stroke: HR.gold, color: undone > 0 ? HR.night : HR.goldHi, alpha: kU });
}

/* 6. Permissions: the approval card, then the lock. */
function sPermissions(t, d, cues) {
  const a1 = at(cues, 1, 3);
  title(S.h_perm, seg(t, 0.1, 0.8));
  permCard(80, 190, 600, "horae plugin add github@0.6.0", S.perm_desc,
    [["network", "api.github.com"], ["secrets", "GITHUB_TOKEN"], ["intents", "task.create, notify.push"], ["runtime", "mcp-stdio"]],
    seg(t, 0.3, 1.4), { ask: S.ask, approved: seg(t, a1, a1 + 0.5) });
  const kL = seg(t, a1 + 0.4, a1 + 1.0);
  panel(730, 260, 470, 120, { r: 12, fill: HR_THEME.term, stroke: HR.line, alpha: kL });
  text(S.lock, 752, 292, { size: 14, font: MONO, color: HR.faint, alpha: kL });
  text(S.lock_line, 752, 336, { size: 15, font: MONO, color: HR.cream, alpha: kL });
  pill(S.noupdate, 730, 430, { align: "left", size: 17, font: SANS, fill: HR.night, stroke: HR.gold, color: HR.goldHi, alpha: seg(t, a1 + 1.6, a1 + 2.2) });
}

/* 7. Models: four backends around the dial. */
function sModels(t, d, cues) {
  const a1 = at(cues, 1, 2);
  title(S.h_models, seg(t, 0.1, 0.8), 120, 54, 640, { align: "center" });
  dial(640, 400, 150, { k: seg(t, 0.2, 1.2), numerals: false, h: 7 + t * 0.2, t });
  const pos = [[300, 300], [980, 300], [300, 520], [980, 520]];
  S.m.forEach((s, i) => {
    const k = seg(t, a1 + i * 0.45, a1 + i * 0.45 + 0.5);
    const [x, y] = pos[i];
    line([[x < 640 ? x + 110 : x - 110, y], [x < 640 ? 500 : 780, y < 400 ? 340 : 460]], HR.line, 1, k, [4, 5]);
    pill(s, x, y, { align: "center", size: 20, font: MONO, fill: HR.ink, stroke: HR.gold, color: HR.cream, alpha: k });
  });
}

/* 8. Outro: the dial at dawn, the pipelines lit. */
function sOutro(t, d, cues) {
  hrDawn(t, 0, 3, 0.8);
  const h = 6 + clamp(t / Math.max(1, d - 1)) * 2.2;
  dial(900, 370, 190, { k: seg(t, 0, 1), h, t, pips: [
    { h: 6.5, label: "school-fr", lr: 0.4, on: h >= 6.5 && h < 7.3, done: h >= 7.3 },
    { h: 7.25, label: "daily-brief", lr: 0.6, on: h >= 7.25 && h < 8.3, done: h >= 8.3 },
    { h: 8.5, label: "gmail-triage", on: h >= 8.5 },
    { h: 12.5, label: "github" }, { h: 18, label: "homeassistant" }, { h: 21.5, label: "reminders" },
  ] });
  mark(150, 190, 130, seg(t, 0.1, 1.2));
  text("Horae", 80, 340, { size: 84, weight: 600, font: SERIF, color: HR.cream, alpha: seg(t, 0.3, 0.9) });
  text(S.pre, 82, 385, { size: 16, font: MONO, color: HR.dim, alpha: seg(t, 0.5, 1.1) });
  const a1 = at(cues, 1, 2.5);
  text(S.day, 80, 460, { size: 40, weight: 600, font: SERIF, color: HR.goldHi, alpha: seg(t, a1, a1 + 0.6) });
  text(S.url, 82, 520, { size: 20, font: MONO, weight: 600, color: HR.gold, alpha: seg(t, a1 + 0.6, a1 + 1.2) });
}

VIDEO.create({
  title: { en: "Horae in 90 seconds", fr: "Horae en 90 secondes" },
  kicker: { en: "Horae · narrated tour", fr: "Horae · visite commentée" },
  langs: ["en", "fr"],
  theme: HR_THEME,
  strings: STR,
  background: () => hrSky(0),
  fonts: HR_FONTS,
  poster: "outro",
  scenes: { hook: sHook, intro: sIntro, pipeline: sPipeline, llm: sLlm, intents: sIntents, permissions: sPermissions, models: sModels, outro: sOutro },
});
