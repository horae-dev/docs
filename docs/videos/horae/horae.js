/* Horae visual world for the canvas videos: "The Hours Dial".
 * Loaded after ../engine/engine.js and before each video's scenes.js. Pure helpers only:
 * every function draws from its arguments (no state kept between frames).
 */
"use strict";

const HR = {
  night: "#15132b", night2: "#0e0c1f", ink: "#1d1a3a", ink2: "#29254a", line: "#3a3560",
  cream: "#f3eee4", dim: "#c8c1d3", faint: "#8d86a6",
  gold: "#e9b14c", goldHi: "#f6cf7e", goldDeep: "#9a6512", ember: "#d9783b",
  leaf: "#a6d6a8", red: "#e86a5c", paper: "#faf6ee", paperInk: "#1f1b33",
};
const SERIF = '"Cormorant", Georgia, serif';
const SANS = '"Hanken Grotesk", Inter, sans-serif';

const HR_THEME = {
  bg: HR.night2, bg2: HR.night, panel: HR.ink, panel2: HR.ink2, line: HR.line,
  ink: HR.cream, soft: HR.dim, faint: HR.faint, accent: HR.gold, accent2: HR.goldHi,
  good: HR.leaf, warn: HR.gold, bad: HR.red, deep: HR.night, term: "#0f0d22", termInk: "#e6e1ef",
};
const HR_FONTS = ['600 40px "Cormorant"', '700 40px "Cormorant"', 'italic 500 40px "Cormorant"',
  '400 20px "Hanken Grotesk"', '600 20px "Hanken Grotesk"'];

const ROMAN = ["XXIV", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII",
  "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI", "XXII", "XXIII"];

/* Night sky: gradient, a few deterministic stars, and an optional dawn glow (0..1) at the bottom right. */
function hrSky(dawn = 0) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, HR.night2); g.addColorStop(1, HR.night);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const R = rng(11);
  ctx.save(); ctx.fillStyle = HR.cream;
  for (let i = 0; i < 70; i++) {
    const x = R() * W, y = R() * H * 0.7, r = R() * 1.1 + 0.3, a = R() * 0.5 + 0.15;
    ctx.globalAlpha = a * (1 - dawn * 0.8); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  if (dawn > 0) {
    ctx.save();
    const e = ctx.createRadialGradient(W * 0.72, H * 1.15, 20, W * 0.72, H * 1.15, W * 0.75);
    e.addColorStop(0, `rgba(217,120,59,${0.55 * dawn})`); e.addColorStop(0.45, `rgba(233,177,76,${0.22 * dawn})`); e.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = e; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
}

/* Serif title sliding up as k goes 0 -> 1. */
function title(s, k, y = 140, size = 54, x = 80, o = {}) {
  if (k <= 0) return;
  text(s, x, y + (1 - outCubic(k)) * 16, { size, weight: 600, font: SERIF, color: o.color ?? HR.cream, align: o.align ?? "left", alpha: k });
}
function sub(s, k, y = 192, x = 80, o = {}) {
  if (k <= 0) return 0;
  return para(s, x, y, o.w ?? 760, { size: o.size ?? 22, lh: o.lh ?? 32, font: SANS, color: o.color ?? HR.dim, alpha: k, align: o.align });
}

/* 24-hour dial: noon at the top, sunrise left, sunset right.
 * o: { h (hand hour), from (arc start hour), pips: [{h, label, on, done}], k (build-in 0..1), numerals, labels } */
const dialAngle = (h) => ((h - 12) / 24) * Math.PI * 2 - Math.PI / 2;
function dialPt(cx, cy, h, r) { const a = dialAngle(h); return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; }
function dial(cx, cy, r, o = {}) {
  const k = o.k ?? 1;
  if (k <= 0) return;
  ctx.save(); ctx.globalAlpha *= clamp(k);
  ring(cx, cy, r * 1.19, HR.line, 1);
  ctx.beginPath(); ctx.strokeStyle = HR.line; ctx.lineWidth = 1.5;
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * outCubic(k)); ctx.stroke();
  for (let i = 0; i < 96; i++) {
    const h = i / 4, major = i % 4 === 0;
    if (i / 96 > outCubic(k)) break;
    const [a, b] = dialPt(cx, cy, h, r), [c, d] = dialPt(cx, cy, h, r - (major ? r * 0.065 : r * 0.028));
    line([[a, b], [c, d]], major ? HR.cream : HR.dim, major ? 1.6 : 1, major ? 0.9 : 0.4);
  }
  if (o.numerals !== false) {
    const fs = Math.max(12, r * 0.1);
    for (let h = 0; h < 24; h += 3) {
      const [x, y] = dialPt(cx, cy, h, r + fs * 0.95);
      text(ROMAN[h], x, y + fs * 0.35, { size: fs, weight: 600, font: SERIF, color: HR.dim, align: "center", alpha: seg(k, 0.4, 1) });
    }
  }
  if (o.h !== undefined) {
    const from = o.from ?? 6;
    if (o.h > from) {
      ctx.beginPath(); ctx.strokeStyle = HR.gold; ctx.lineWidth = Math.max(3, r * 0.028); ctx.lineCap = "round"; ctx.globalAlpha *= 0.85;
      ctx.arc(cx, cy, r, dialAngle(from), dialAngle(o.h)); ctx.stroke(); ctx.globalAlpha /= 0.85;
    }
    const [hx, hy] = dialPt(cx, cy, o.h, r * 0.9);
    line([[cx, cy], [hx, hy]], HR.gold, Math.max(2, r * 0.014));
    const [sx, sy] = dialPt(cx, cy, o.h, r * 1.19);
    dot(sx, sy, Math.max(3, r * 0.028), HR.goldHi);
  }
  (o.pips || []).forEach((p) => {
    const [x, y] = dialPt(cx, cy, p.h, r * 0.71);
    const pr = Math.max(4, r * 0.033);
    if (p.on) ring(x, y, pr * (1.6 + 0.6 * Math.sin((o.t ?? 0) * 4)), HR.gold, 1.5, 0.6);
    dot(x, y, pr, p.on ? HR.gold : p.done ? HR.cream : HR.night);
    ring(x, y, pr, p.on ? HR.goldHi : p.done ? HR.cream : HR.dim, 1.5);
    if (p.label && o.labels !== false) {
      const [lx, ly] = dialPt(cx, cy, p.h, r * (p.lr ?? 0.56));
      const align = lx > cx + 8 ? "right" : lx < cx - 8 ? "left" : "center";
      text(p.label, lx, ly + 4, { size: Math.max(10, r * 0.052), font: MONO, color: p.on ? HR.goldHi : HR.dim, align });
    }
  });
  dot(cx, cy, Math.max(4, r * 0.04), HR.gold);
  dot(cx, cy, Math.max(1.5, r * 0.016), HR.night);
  ctx.restore();
}

/* The Horae mark (rays, a gold hour arc, two columns and a gold lintel), drawn centred at (cx, cy), size s. */
function mark(cx, cy, s, k = 1) {
  if (k <= 0) return;
  const f = s / 512;
  ctx.save(); ctx.globalAlpha *= clamp(k);
  ctx.translate(cx - s / 2, cy - s / 2); ctx.scale(f, f);
  ctx.lineCap = "round";
  for (let i = 0; i < 12; i++) {
    if (i / 12 > seg(k, 0, 0.6)) break;
    const a = -Math.PI / 2 + (i * Math.PI) / 6, major = i % 3 === 0;
    ctx.strokeStyle = i === 0 ? HR.gold : HR.cream; ctx.lineWidth = major ? 14 : 9;
    const r1 = major ? 160 : 160, r2 = major ? 196 : 176;
    ctx.beginPath(); ctx.moveTo(256 + Math.cos(a) * r1, 256 + Math.sin(a) * r1); ctx.lineTo(256 + Math.cos(a) * r2, 256 + Math.sin(a) * r2); ctx.stroke();
  }
  ctx.strokeStyle = HR.gold; ctx.lineWidth = 10; ctx.globalAlpha *= 0.9;
  ctx.beginPath(); ctx.arc(256, 256, 140, -Math.PI / 2, -Math.PI / 2 + (Math.PI / 3) * seg(k, 0.3, 0.8)); ctx.stroke();
  ctx.globalAlpha /= 0.9;
  const ck = outCubic(seg(k, 0.35, 0.9));
  ctx.fillStyle = HR.cream;
  [[190, 178, 30, 156], [292, 178, 30, 156], [180, 168, 50, 14], [282, 168, 50, 14], [180, 330, 50, 14], [282, 330, 50, 14]].forEach(([x, y, w, h]) => {
    rr(x, y + (h > 20 ? h * (1 - ck) : 0), w, h > 20 ? h * ck : h, 4); ctx.globalAlpha = clamp(k) * (h > 20 ? 1 : ck); ctx.fill();
  });
  ctx.fillStyle = HR.gold; ctx.globalAlpha = clamp(k) * seg(k, 0.8, 1);
  rr(220, 246, 72, 20, 3); ctx.fill();
  ctx.restore();
}

/* A pipeline step chip. kind: "llm" (gold), "off" (struck), "ok" (green), default (quiet). Returns its width. */
function step(s, x, y, o = {}) {
  const kind = o.kind;
  const w = pill(s, x, y, {
    align: o.align ?? "left", size: o.size ?? 16, font: MONO, alpha: o.alpha ?? 1,
    fill: kind === "llm" ? "rgba(233,177,76,0.12)" : kind === "active" ? HR.gold : HR.night,
    stroke: kind === "llm" || kind === "active" ? HR.gold : HR.line,
    color: kind === "llm" ? HR.goldHi : kind === "active" ? HR.night : kind === "off" ? HR.faint : HR.dim,
  });
  if (kind === "off" && (o.alpha ?? 1) > 0) {
    const sx = o.align === "center" ? x - w / 2 : x;
    line([[sx + 10, y], [sx + w - 10, y]], HR.faint, 1.5, o.alpha ?? 1);
  }
  return w;
}
/* A row of steps with arrows between them; ks[i] is each chip's build-in. Returns the x positions. */
function stepRow(steps, x, y, ks, o = {}) {
  const gap = o.gap ?? 34, xs = [];
  let cx = x;
  steps.forEach((s, i) => {
    const name = typeof s === "string" ? s : s.s, kind = typeof s === "string" ? undefined : s.kind;
    const w = measure(name, o.size ?? 16, 600, MONO) + 28;
    xs.push(cx + w / 2);
    step(name, cx, y, { kind, alpha: ks[i] ?? 1, size: o.size });
    if (i < steps.length - 1) arrow(cx + w + 6, y, cx + w + gap - 6, y, ks[i + 1] ?? 1, HR.line);
    cx += w + gap;
  });
  return xs;
}

/* Cream permission card (the plugin approval prompt). rows: [[label, value]]. */
function permCard(x, y, w, head, desc, rows, k, o = {}) {
  if (k <= 0) return;
  const lh = 30, h = 120 + rows.length * lh + 56;
  ctx.save(); ctx.globalAlpha *= clamp(k);
  ctx.translate(0, (1 - outCubic(k)) * 20);
  panel(x, y, w, h, { r: 16, fill: HR.paper, stroke: false, shadow: true });
  text(head, x + 28, y + 50, { size: 22, weight: 700, font: MONO, color: HR.paperInk });
  text(desc, x + 28, y + 82, { size: 16, font: SANS, color: "#514a66" });
  rows.forEach(([a, b], i) => {
    const kk = seg(k, 0.3 + i * 0.1, 0.6 + i * 0.1);
    text(a, x + 28, y + 128 + i * lh, { size: 16, weight: 700, font: MONO, color: "#7a4c06", alpha: kk });
    text(b, x + 160, y + 128 + i * lh, { size: 16, font: MONO, color: HR.paperInk, alpha: kk });
  });
  const ay = y + 120 + rows.length * lh + 14;
  line([[x + 28, ay], [x + w - 28, ay]], "#cfc5b0", 1, 1, [4, 4]);
  text(o.ask ?? "Approve these permissions?", x + 28, ay + 30, { size: 17, weight: 600, font: SANS, color: HR.paperInk });
  pill(o.keys ?? "y / N", x + w - 28, ay + 25, { align: "right", size: 15, font: MONO, fill: HR.night, stroke: HR.night, color: HR.cream });
  if (o.approved) check(x + w - 120, ay + 25, 22, "#2f7d3a", o.approved);
  ctx.restore();
}
