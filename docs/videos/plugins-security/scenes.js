/* Plugins and security (engine: ../engine/engine.js, world: ../horae/horae.js).
 * Scenes are pure functions of t; animations hang on the spoken sentences (at(cues, i)).
 * Commits, the upgraded host and the audit rows are illustrative and labelled "(example)".
 * Facts: horae README "Getting started", docs/operations/plugin-containers.md, plugin-github 0.6.0 plugin.yaml.
 */
"use strict";

const STR = {
  en: {
    h_risk: "Who holds the keys?", plugin: "plugin", accounts: ["mail", "bank", "school"], all: "every key, to one plugin?",
    h_add: "Plugins come from git.",
    st: ["resolve", "clone", "verify tag", "verify commit"],
    h_ok: "Read before you approve.",
    perm_desc: "GitHub review requests, assignments and mentions as tasks.",
    ask: "Approve these permissions and install github?",
    yes: "y  →  pinned in horae.lock", no: "N  →  nothing is installed",
    h_lock: "Pinned. Asked again.", ex: "(example)",
    upq: "Approve and upgrade github to 0.7.0?", noupdate: "nothing updates itself",
    h_box: "Third-party plugins: a container.",
    core: "Horae", props: ["non-root", "read-only", "no capabilities", "no route out"],
    proxy: "egress proxy", approved: "approved in horae.lock", never: "never on the command line",
    h_audit: "Every plugin, accounted for.", exit4: "exit 4 on drift",
    gates: "The Horae guard the gates.", url: "horae-dev.github.io/docs",
  },
  fr: {
    h_risk: "Qui tient les clés ?", plugin: "plugin", accounts: ["mail", "banque", "école"], all: "toutes les clés, à un seul plugin ?",
    h_add: "Les plugins viennent de git.",
    st: ["résoudre", "cloner", "vérifier le tag", "vérifier le commit"],
    h_ok: "Lire avant d'approuver.",
    perm_desc: "Revues, assignations et mentions GitHub en tâches.",
    ask: "Approuver ces permissions et installer github ?",
    yes: "y  →  épinglé dans horae.lock", no: "N  →  rien n'est installé",
    h_lock: "Épinglé. Redemandé.", ex: "(exemple)",
    upq: "Approve and upgrade github to 0.7.0?", noupdate: "rien ne se met à jour tout seul",
    h_box: "Plugins tiers : un conteneur.",
    core: "Horae", props: ["sans root", "lecture seule", "aucune capacité", "aucune route sortante"],
    proxy: "proxy de sortie", approved: "approuvé dans horae.lock", never: "jamais sur la ligne de commande",
    h_audit: "Chaque plugin, sous contrôle.", exit4: "code de sortie 4 si écart",
    gates: "Les Horae gardent les portes.", url: "horae-dev.github.io/docs",
  },
};

/* A dark code panel: a file name, then lines [text, color?] fading in from `a`, one every `dt`. */
function codePanel(x, y, w, h, name, lines, t, a, dt, o = {}) {
  const k = o.alpha ?? seg(t, a - 0.3, a);
  if (k <= 0) return;
  const size = o.size ?? 15, lh = o.lh ?? 27;
  panel(x, y, w, h, { r: 14, fill: HR_THEME.term, stroke: HR.line, alpha: k });
  if (name) text(name, x + 24, y + 32, { size: 13, font: MONO, color: HR.faint, alpha: k });
  lines.forEach((l, i) => {
    const [s, c] = Array.isArray(l) ? l : [l];
    const kk = seg(t, a + i * dt, a + i * dt + 0.3) * k;
    text(s, x + 24, y + (name ? 70 : 44) + i * lh, { size, font: MONO, color: c ?? HR.cream, alpha: kk });
  });
}

/* Dawn glow over the sky, ramping to `max` between a and b. */
function hrDawn(t, a, b, max) {
  const k = seg(t, a, b) * max;
  if (k <= 0) return;
  ctx.save();
  const e = ctx.createRadialGradient(W * 0.72, H * 1.15, 20, W * 0.72, H * 1.15, W * 0.75);
  e.addColorStop(0, `rgba(217,120,59,${0.55 * k})`); e.addColorStop(0.45, `rgba(233,177,76,${0.22 * k})`); e.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = e; ctx.fillRect(0, 0, W, H); ctx.restore();
}

/* 1. The risk: one plugin, arrows to every sensitive account. */
function sRisk(t, d, cues) {
  const a1 = at(cues, 1, 3.5);
  title(S.h_risk, seg(t, 0.1, 0.8));
  const kP = seg(t, 0.3, 0.9), red = seg(t, a1, a1 + 0.6);
  panel(160, 310, 240, 120, { r: 16, fill: HR.ink2, stroke: HR.gold, lw: 1.5, alpha: kP });
  text(S.plugin, 280, 380, { size: 28, font: MONO, color: HR.goldHi, align: "center", alpha: kP });
  S.accounts.forEach((name, i) => {
    const y = 210 + i * 130, k = seg(t, 0.6 + i * 0.3, 1.1 + i * 0.3);
    panel(820, y, 300, 90, { r: 14, fill: HR.ink, stroke: red > 0 ? HR.red : HR.line, lw: 1.5, alpha: k });
    text(name, 970, y + 54, { size: 26, font: SANS, weight: 600, color: HR.cream, align: "center", alpha: k });
    const ka = seg(t, 1.0 + i * 0.35, 1.8 + i * 0.35);
    arrow(410, 370, 805, y + 45, ka, red > 0 ? HR.red : HR.dim);
  });
  if (red > 0) text(S.all, 640, 600, { size: 34, font: SERIF, weight: 600, color: HR.red, align: "center", alpha: red });
}

/* 2. horae plugin add: resolve, clone, verify the tag and the commit. */
function sAdd(t, d, cues) {
  const a1 = at(cues, 1, 2);
  title(S.h_add, seg(t, 0.1, 0.8));
  terminal(80, 190, 1120, 250, t, [
    { p: "$ ", s: "horae plugin add github@0.6.0", a: a1, b: a1 + 1.2 },
    { s: "resolve  github@0.6.0  marketplace  first-party", a: a1 + 1.6, c: HR.dim },
    { s: "clone    https://github.com/horae-dev/plugin-github", a: a1 + 2.4, c: HR.dim },
    { s: "verify   tag v0.6.0  →  commit 3f2c9e1a7b4d…", a: a1 + 3.3, c: HR.leaf },
    { s: "verify   the checkout is the pinned commit", a: a1 + 4.1, c: HR.leaf },
  ], { title: "zsh · " + S.ex, alpha: seg(t, 0.3, 0.8), size: 16, lh: 34 });
  const ks = [0, 1, 2, 3].map((i) => seg(t, a1 + 1.6 + i * 0.8, a1 + 2.0 + i * 0.8));
  const active = t > a1 + 1.6 ? Math.min(3, Math.floor((t - a1 - 1.6) / 0.8)) : -1;
  stepRow(S.st.map((s, i) => ({ s, kind: i === active ? "active" : undefined })), 80, 510, ks, { size: 17, gap: 40 });
}

/* 3. The approval card: what it asks for, y or N. */
function sApprove(t, d, cues) {
  const a1 = at(cues, 1, 5);
  title(S.h_ok, seg(t, 0.1, 0.8));
  permCard(80, 190, 640, "horae plugin add github@0.6.0", S.perm_desc,
    [["network", "api.github.com"], ["secrets", "GITHUB_TOKEN"], ["optional", "GITHUB_NOTIFICATIONS_TOKEN"], ["intents", "task.create, notify.push"], ["paths", "none"]],
    seg(t, 0.3, 2.2), { ask: S.ask, approved: seg(t, a1 + 1.4, a1 + 1.9) });
  const ky = seg(t, a1, a1 + 0.5), kn = seg(t, a1 + 0.5, a1 + 1.0);
  pill(S.yes, 780, 300, { align: "left", size: 17, font: MONO, fill: HR.night, stroke: HR.leaf, color: HR.leaf, alpha: ky });
  pill(S.no, 780, 380, { align: "left", size: 17, font: MONO, fill: HR.night, stroke: HR.red, color: HR.red, alpha: kn });
}

/* 4. horae.lock pins the commit; an upgrade that widens asks again. */
function sLock(t, d, cues) {
  const a1 = at(cues, 1, 3), a2 = at(cues, 2, 6);
  title(S.h_lock, seg(t, 0.1, 0.8));
  const G = HR.goldHi;
  codePanel(80, 190, 520, 290, "horae.lock  " + S.ex, [
    ["plugins:", G], ["  github:", G], ["    version: 0.6.0"], ["    repo: https://github.com/horae-dev/plugin-github"],
    ["    commit: 3f2c9e1a7b4d…", HR.goldHi], ["    permissions:", G], ["      network: [api.github.com]"],
  ], t, 0.5, 0.15, { size: 14, lh: 27 });
  highlight(100, 190 + 70 + 4 * 27 - 16, 240, 22, seg(t, 1.6, 2.4), HR.gold);
  terminal(640, 190, 560, 290, t, [
    { p: "$ ", s: "horae plugin upgrade github", a: a1, b: a1 + 1.0 },
    { s: "  network (https hosts):", a: a1 + 1.3, c: HR.dim },
    { s: "    + uploads.github.com  (new: needs approval)", a: a1 + 1.7, c: HR.goldHi, w: 700 },
    { s: S.upq + " [y/N]", a: a1 + 2.3, c: HR.cream },
  ], { title: "zsh · " + S.ex, alpha: seg(t, a1 - 0.3, a1), size: 14, lh: 32 });
  pill(S.noupdate, 640, 560, { align: "center", size: 20, font: SANS, fill: HR.night, stroke: HR.gold, color: HR.goldHi, alpha: seg(t, a2, a2 + 0.6) });
}

/* 5. The container: no root, read-only, no capability, only its own proxy; secrets through stdin. */
function sContainer(t, d, cues) {
  const a1 = at(cues, 1, 6);
  title(S.h_box, seg(t, 0.1, 0.8));
  const kC = seg(t, 0.3, 1.0);
  panel(80, 290, 170, 110, { r: 14, fill: HR.ink2, stroke: HR.gold, alpha: kC });
  text(S.core, 165, 355, { size: 30, weight: 600, font: SERIF, color: HR.cream, align: "center", alpha: kC });
  const bx = 400, by = 200, bw = 380, bh = 330;
  ctx.save(); ctx.globalAlpha *= kC;
  rr(bx, by, bw, bh, 18); ctx.fillStyle = "rgba(29,26,58,0.85)"; ctx.fill();
  ctx.setLineDash([10, 6]); ctx.lineWidth = 2; ctx.strokeStyle = HR.gold; ctx.stroke(); ctx.restore();
  text("docker run --init", bx + 20, by + 30, { size: 13, font: MONO, color: HR.faint, alpha: kC });
  pill("plugin", bx + bw / 2, by + 72, { align: "center", size: 18, font: MONO, fill: HR.ink2, stroke: HR.goldHi, color: HR.goldHi, alpha: kC });
  const flags = ["--user <uid>:<gid>", "--read-only", "--cap-drop ALL", "--network internal"];
  S.props.forEach((p, i) => {
    const k = seg(t, 1.2 + i * 0.6, 1.7 + i * 0.6), y = by + 135 + i * 48;
    check(bx + 30, y - 6, 16, HR.leaf, k);
    text(p, bx + 50, y, { size: 18, font: SANS, weight: 600, color: HR.cream, alpha: k });
    text(flags[i], bx + 50, y + 20, { size: 12, font: MONO, color: HR.faint, alpha: k });
  });
  const kp = seg(t, 3.6, 4.2);
  arrow(785, 345, 845, 345, kp, HR.line);
  panel(850, 300, 150, 90, { r: 12, fill: HR.ink, stroke: HR.line, alpha: kp });
  text(S.proxy, 925, 352, { size: 15, font: MONO, color: HR.cream, align: "center", alpha: kp });
  arrow(1005, 330, 1045, 300, kp, HR.leaf);
  text("api.github.com", 1050, 296, { size: 15, font: MONO, color: HR.leaf, alpha: kp });
  text(S.approved, 1050, 318, { size: 12, font: SANS, color: HR.faint, alpha: kp });
  arrow(1005, 362, 1045, 392, kp, HR.red);
  text("evil.example", 1050, 398, { size: 15, font: MONO, color: HR.red, alpha: kp });
  text("403", 1050, 420, { size: 12, font: MONO, color: HR.faint, alpha: kp });
  const ks = seg(t, a1, a1 + 0.8);
  arrow(255, 330, 395, 330, ks, HR.gold);
  text("stdin", 325, 318, { size: 14, font: MONO, color: HR.goldHi, align: "center", alpha: ks });
  pill('{"GITHUB_TOKEN": "…"}', 80, 470, { align: "left", size: 14, font: MONO, fill: HR.night, stroke: HR.gold, color: HR.goldHi, alpha: ks });
  const kx = seg(t, a1 + 1.4, a1 + 2.0);
  cross(92, 540, 10, HR.red, kx);
  text("argv · docker inspect", 110, 545, { size: 14, font: MONO, color: HR.faint, alpha: kx });
  text(S.never, 80, 584, { size: 18, font: SANS, color: HR.red, alpha: kx });
}

/* 6. horae plugin audit: the table, one drift row flagged. */
function sAudit(t, d, cues) {
  const a0 = at(cues, 0, 0.5), e0 = atEnd(cues, 0, 7);
  title(S.h_audit, seg(t, 0.1, 0.8));
  const row = (c) => c.map((s, i) => s.padEnd([9, 9, 13, 13, 9, 27, 0][i])).join("").trimEnd();
  const a = a0 + 0.2, flag = a + (e0 - a) * 0.72;
  terminal(80, 190, 1120, 330, t, [
    { p: "$ ", s: "horae plugin audit", a, b: a + 0.8 },
    { s: row(["NAME", "VERSION", "SOURCE", "TIER", "ENABLED", "LAST ACTIVITY", "DRIFT"]), a: a + 1.1, c: HR.faint },
    { s: row(["github", "0.6.0", "marketplace", "first-party", "yes", "2026-11-25T07:30:00+00:00", "-"]), a: a + 1.5 },
    { s: row(["weather", "0.2.1", "marketplace", "community", "yes", "never", "1"]), a: a + 1.8 },
    { s: "github:", a: a + 2.3, c: HR.goldHi },
    { s: "  network: api.github.com    secrets: GITHUB_TOKEN    intents: task.create, notify.push", a: a + 2.5, c: HR.dim },
    { s: "weather:", a: a + 2.8, c: HR.goldHi },
    { s: "  drift (runtime_not_container): not first-party, but horae.yaml runs it as a process", a: flag, c: HR.red },
  ], { title: "zsh · " + S.ex, size: 14, lh: 31 });
  const kf = seg(t, flag, flag + 0.6);
  if (kf > 0) {
    ctx.save(); ctx.globalAlpha *= kf; ctx.strokeStyle = HR.red; ctx.lineWidth = 2;
    const y = 190 + 62 + 3 * 31 - 20, h = 28, x1 = 88, x2 = 1188;
    [[x1, 1], [x2, -1]].forEach(([x, s]) => { ctx.beginPath(); ctx.moveTo(x + s * 12, y); ctx.lineTo(x, y); ctx.lineTo(x, y + h); ctx.lineTo(x + s * 12, y + h); ctx.stroke(); });
    ctx.restore();
  }
  pill(S.exit4, 1200, 570, { align: "right", size: 16, font: MONO, fill: HR.night, stroke: HR.red, color: HR.red, alpha: seg(t, flag + 0.5, flag + 1.0) });
}

/* 7. Outro: the mark, the gates. */
function sOutro(t, d, cues) {
  hrDawn(t, 0, 3, 0.7);
  mark(640, 250, 240, seg(t, 0.2, 1.8));
  const a1 = at(cues, 1, 3);
  text(S.gates, 640, 470, { size: 50, weight: 600, font: SERIF, color: HR.goldHi, align: "center", alpha: seg(t, 0.9, 1.6) });
  text(S.url, 640, 530, { size: 20, font: MONO, weight: 600, color: HR.gold, align: "center", alpha: seg(t, a1, a1 + 0.6) });
}

VIDEO.create({
  title: { en: "Plugins and security", fr: "Plugins et sécurité" },
  kicker: { en: "Horae · narrated tour", fr: "Horae · visite commentée" },
  langs: ["en", "fr"],
  theme: HR_THEME,
  strings: STR,
  background: () => hrSky(0),
  fonts: HR_FONTS,
  poster: "approve",
  scenes: { risk: sRisk, add: sAdd, approve: sApprove, lock: sLock, container: sContainer, audit: sAudit, outro: sOutro },
});
