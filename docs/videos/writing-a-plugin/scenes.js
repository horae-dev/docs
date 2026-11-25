/* Writing a plugin (engine: ../engine/engine.js, world: ../horae/horae.js).
 * Scenes are pure functions of t; animations hang on the spoken sentences (at(cues, i)).
 * Facts: horae sdk/README.md, docs/writing-a-plugin.md, horae-dev/template-plugin README,
 * horae-dev/marketplace README, plugin-github 0.6.0 plugin.yaml. Sample values are labelled "(example)".
 */
"use strict";

const STR = {
  en: {
    h_intro: "A plugin is a small MCP server.", core: "Horae core", stdio: "MCP · stdio",
    roles: ["source", "transform", "sink", "notifier"], data: "data", props: "intents",
    applies: "only the core applies",
    h_tpl: "Start from the template.",
    tree: [["plugin.yaml", "manifest"], ["src/example_plugin/plugin.py", "the server"], ["tests/recordings/", "recorded inputs"], [".github/workflows/ci.yml", "CI"], ["scripts/rename.py", "rename the example"]],
    h_man: "Declare the least you need.", gen: "generated from the code", matches: "test_manifest.py: the two match",
    h_code: "A source, in Python.", validates: "validates every intent", declared: "declared", undeclared: "not declared: refused",
    h_tests: "Recorded inputs, offline.", ex: "(example)",
    off: ["offline", "no real account", "no real secret"],
    h_pub: "Tag it, then open a pull request.",
    cols: ["your repository", "pull request · horae-dev/marketplace", "marketplace CI"],
    ci: ["clone (https only)", "the commit exists", "tag v0.1.0 is that commit", "plugin.yaml passes the validator"],
    h_out: "Read, then say yes.", desc: "Proposes a task per message.", ask: "Approve these permissions and install acme?",
    url: "horae-dev.github.io/docs",
  },
  fr: {
    h_intro: "Un plugin, un petit serveur MCP.", core: "cœur Horae", stdio: "MCP · stdio",
    roles: ["source", "transform", "sink", "notifier"], data: "données", props: "intentions",
    applies: "seul le cœur applique",
    h_tpl: "Partir du modèle.",
    tree: [["plugin.yaml", "manifeste"], ["src/example_plugin/plugin.py", "le serveur"], ["tests/recordings/", "entrées enregistrées"], [".github/workflows/ci.yml", "CI"], ["scripts/rename.py", "renommer l'exemple"]],
    h_man: "Déclarer le strict nécessaire.", gen: "généré depuis le code", matches: "test_manifest.py : les deux concordent",
    h_code: "Une source, en Python.", validates: "valide chaque intention", declared: "déclarée", undeclared: "non déclarée : refusée",
    h_tests: "Entrées enregistrées, hors ligne.", ex: "(exemple)",
    off: ["hors ligne", "aucun vrai compte", "aucun vrai secret"],
    h_pub: "Un tag, puis une pull request.",
    cols: ["votre dépôt", "pull request · horae-dev/marketplace", "CI du marketplace"],
    ci: ["clone (https seulement)", "le commit existe", "le tag v0.1.0 est ce commit", "plugin.yaml passe le validateur"],
    h_out: "Lire, puis dire oui.", desc: "Propose une tâche par message.", ask: "Approuver ces permissions et installer acme ?",
    url: "horae-dev.github.io/docs",
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

/* 1. The contract: the core talks MCP to the plugin; data and intents come back; only the core applies. */
function sIntro(t, d, cues) {
  const a1 = at(cues, 1, 4), a2 = at(cues, 2, 6);
  title(S.h_intro, seg(t, 0.1, 0.8));
  const kC = seg(t, 0.3, 0.9), kP = seg(t, 0.6, 1.2);
  panel(80, 290, 220, 130, { r: 14, fill: HR.ink2, stroke: HR.gold, alpha: kC });
  text(S.core, 190, 362, { size: 30, weight: 600, font: SERIF, color: HR.cream, align: "center", alpha: kC });
  const kw = seg(t, 1.0, 1.8);
  arrow(310, 335, 470, 335, kw, HR.dim);
  arrow(470, 375, 310, 375, kw, HR.dim);
  text(S.stdio, 390, 320, { size: 14, font: MONO, color: HR.goldHi, align: "center", alpha: kw });
  panel(480, 230, 330, 250, { r: 16, fill: HR.ink, stroke: HR.line, lw: 1.5, alpha: kP });
  text("plugin", 645, 270, { size: 22, font: MONO, color: HR.cream, align: "center", alpha: kP });
  S.roles.forEach((r, i) => {
    step(r, 645, 316 + i * 40, { align: "center", size: 15, alpha: seg(t, 1.2 + i * 0.25, 1.6 + i * 0.25) });
  });
  const kd = seg(t, a1, a1 + 0.6), ki = seg(t, a1 + 0.6, a1 + 1.2);
  arrow(820, 300, 900, 300, kd, HR.line);
  pill(S.data, 910, 300, { align: "left", size: 17, font: MONO, fill: HR.night, stroke: HR.line, color: HR.cream, alpha: kd });
  arrow(820, 370, 900, 370, ki, HR.gold);
  pill(S.props + "  task.create", 910, 370, { align: "left", size: 17, font: MONO, fill: HR.night, stroke: HR.gold, color: HR.goldHi, alpha: ki });
  const kx = seg(t, a2, a2 + 0.6);
  cross(660, 530, 12, HR.red, kx);
  text("write()", 682, 536, { size: 17, font: MONO, color: HR.faint, alpha: kx });
  pill(S.applies, 640, 600, { align: "center", size: 20, font: SANS, fill: HR.night, stroke: HR.gold, color: HR.goldHi, alpha: seg(t, a2 + 0.5, a2 + 1.1) });
}

/* 2. The template: gh repo create, the tree, the rename script. */
function sTemplate(t, d, cues) {
  const a1 = at(cues, 1, 2.5), a2 = at(cues, 2, 6);
  title(S.h_tpl, seg(t, 0.1, 0.8));
  terminal(80, 180, 1120, 100, t, [
    { p: "$ ", s: "gh repo create you/plugin-acme --template horae-dev/template-plugin", a: 0.5, b: 2.0 },
  ], { title: "zsh", alpha: seg(t, 0.2, 0.5), size: 16 });
  const kT = seg(t, a1 - 0.3, a1);
  panel(80, 305, 640, 250, { r: 14, fill: HR_THEME.term, stroke: HR.line, alpha: kT });
  text("you/plugin-acme", 104, 337, { size: 13, font: MONO, color: HR.faint, alpha: kT });
  S.tree.forEach(([p, what], i) => {
    const k = seg(t, a1 + i * 0.4, a1 + i * 0.4 + 0.4), y = 375 + i * 36;
    text(p, 104, y, { size: 15, font: MONO, color: HR.cream, alpha: k });
    text(what, 440, y, { size: 16, font: SANS, color: i === 4 ? HR.goldHi : HR.dim, alpha: k });
  });
  terminal(760, 305, 440, 250, t, [
    { p: "$ ", s: "python3 scripts/rename.py \\", a: a2, b: a2 + 0.8 },
    { s: "    horae-plugin-acme \\", a: a2 + 0.8, b: a2 + 1.2 },
    { s: "    acme_plugin acme", a: a2 + 1.2, b: a2 + 1.6 },
  ], { title: "zsh", alpha: seg(t, a2 - 0.3, a2), size: 15 });
}

/* 3. plugin.yaml: provides, permissions, runtime; generated from the code. */
function sManifest(t, d, cues) {
  const a0 = at(cues, 0, 0.5), a1 = at(cues, 1, 6);
  title(S.h_man, seg(t, 0.1, 0.8));
  const G = HR.goldHi;
  codePanel(80, 180, 600, 400, "plugin.yaml · plugin-github 0.6.0", [
    ["name: github", G], ["version: 0.6.0"], ["provides:", G], ["  sources: [github.review_requests, …]"],
    ["permissions:", G], ["  network: [api.github.com]"], ["  secrets: [GITHUB_TOKEN]"], ["  optional_secrets: [GITHUB_NOTIFICATIONS_TOKEN]"],
    ["  intents: [task.create, notify.push]"], ["runtime:", G], ["  protocol: mcp-stdio"], ["  command: [python3, -m, horae_github]"],
  ], t, a0 + 0.3, 0.35, { size: 14, lh: 26 });
  const kh = seg(t, a0 + 3.2, a0 + 4.0);
  highlight(96, 180 + 70 + 4 * 26 - 14, 470, 5 * 26 - 8, kh, HR.gold);
  terminal(720, 250, 480, 150, t, [
    { p: "$ ", s: "uv run python -m horae_github \\", a: a1, b: a1 + 1.0 },
    { s: "    --manifest > plugin.yaml", a: a1 + 1.0, b: a1 + 1.6 },
  ], { title: "zsh", alpha: seg(t, a1 - 0.3, a1), size: 15 });
  text(S.gen, 720, 440, { size: 20, font: SANS, weight: 600, color: HR.goldHi, alpha: seg(t, a1 + 1.4, a1 + 2.0) });
  const km = seg(t, a1 + 2.2, a1 + 2.8);
  check(732, 484, 16, HR.leaf, km);
  text(S.matches, 752, 490, { size: 15, font: MONO, color: HR.leaf, alpha: km });
}

/* 4. The code: the SDK's hello source, its output, and the core's check. */
function sCode(t, d, cues) {
  const a1 = at(cues, 1, 5);
  title(S.h_code, seg(t, 0.1, 0.8));
  const K = HR.goldHi, F = HR.faint;
  codePanel(80, 180, 720, 330, "examples/hello/hello_plugin.py · horae-sdk", [
    ["from horae_sdk import Call, Output, Permissions, Plugin, intents", F],
    ["plugin = Plugin(\"hello\", version=\"0.1.0\","],
    ["                permissions=Permissions(intents=[\"task.create\"]))", K],
    [""],
    ["@plugin.source(\"hello.greet\")", K],
    ["def greet(call: Call, name: str = \"world\") -> Output:"],
    ["    task = intents.task_create(f\"Greet {name} back\","],
    ["                key=intents.fingerprint(\"hello\", name))"],
    ["    return Output({\"greeting\": f\"Hello, {name}!\"}, intents=[task])", HR.cream],
  ], t, 0.4, 0.3, { size: 14, lh: 27 });
  const ko = seg(t, 3.0, 3.6);
  pill("{\"greeting\": \"Hello, Ada!\"}", 840, 230, { align: "left", size: 14, font: MONO, fill: HR.night, stroke: HR.line, color: HR.cream, alpha: ko });
  pill("task.create · Greet Ada back", 840, 280, { align: "left", size: 14, font: MONO, fill: HR.night, stroke: HR.gold, color: HR.goldHi, alpha: seg(t, 3.5, 4.1) });
  const kc = seg(t, a1, a1 + 0.6);
  arrow(1000, 305, 1000, 345, kc, HR.gold);
  panel(840, 350, 360, 80, { r: 14, fill: HR.ink2, stroke: HR.gold, alpha: kc });
  text(S.validates, 1020, 398, { size: 19, font: SANS, weight: 600, color: HR.cream, align: "center", alpha: kc });
  const k1 = seg(t, a1 + 0.9, a1 + 1.4), k2 = seg(t, a1 + 1.5, a1 + 2.0);
  check(852, 466, 16, HR.leaf, k1);
  text("task.create · " + S.declared, 872, 472, { size: 15, font: MONO, color: HR.leaf, alpha: k1 });
  cross(852, 506, 9, HR.red, k2);
  text("note.create · " + S.undeclared, 872, 512, { size: 15, font: MONO, color: HR.red, alpha: k2 });
}

/* 5. Tests: a recording, pytest green, offline. */
function sTests(t, d, cues) {
  const a1 = at(cues, 1, 4);
  title(S.h_tests, seg(t, 0.1, 0.8));
  const K = HR.goldHi;
  codePanel(80, 180, 560, 250, "tests/recordings/ · " + S.ex, [
    "{", ["  \"tool\": \"hello.shout\",", K], "  \"params\": {},", "  \"input\": {\"greeting\": \"Hello, Ada!\"},",
    ["  \"expect\": {\"data\": {\"greeting\": \"HELLO, ADA!\"},", HR.leaf], ["             \"intents\": []}", HR.leaf], "}",
  ], t, 0.4, 0.2, { size: 14, lh: 24 });
  codePanel(80, 450, 560, 110, "tests/test_recordings.py", [
    "replay_all(plugin, Path(__file__).parent / \"recordings\")",
  ], t, 1.4, 0.2, { size: 14 });
  terminal(680, 180, 520, 200, t, [
    { p: "$ ", s: "uv run pytest", a: 1.6, b: 2.3 },
    { s: "tests/test_recordings.py ...", a: 2.6, c: HR.dim },
    { s: "3 passed  " + S.ex, a: 3.2, c: HR.leaf, w: 700 },
  ], { title: "zsh", alpha: seg(t, 1.3, 1.6), size: 15 });
  S.off.forEach((s, i) => {
    const k = seg(t, (i === 0 ? at(cues, 0, 1) + 2.4 : a1 + (i - 1) * 0.6), (i === 0 ? at(cues, 0, 1) + 3.0 : a1 + (i - 1) * 0.6 + 0.5));
    const y = 430 + i * 52;
    check(698, y - 6, 16, HR.leaf, k);
    text(s, 720, y, { size: 20, font: SANS, weight: 600, color: HR.cream, alpha: k });
  });
}

/* 6. Publishing: a tag, an index entry, the marketplace's CI. */
function sPublish(t, d, cues) {
  const a1 = at(cues, 1, 5), a0 = at(cues, 0, 0.5);
  title(S.h_pub, seg(t, 0.1, 0.8));
  const xs = [80, 475, 870], cw = 330;
  const kA = seg(t, a0 + 0.8, a0 + 1.3), kB = seg(t, a0 + 2.6, a0 + 3.2), kC = seg(t, a1, a1 + 0.5);
  [kA, kB, kC].forEach((k, i) => {
    text(S.cols[i], xs[i], 215, { size: 15, font: SANS, weight: 600, color: HR.dim, alpha: k });
    panel(xs[i], 235, cw, 260, { r: 14, fill: HR_THEME.term, stroke: i === 2 ? HR.gold : HR.line, alpha: k });
    if (i < 2) arrow(xs[i] + cw + 8, 365, xs[i + 1] - 8, 365, [kB, kC][i], HR.gold);
  });
  [["$ git tag v0.1.0", HR.cream], ["$ git push origin v0.1.0", HR.cream]].forEach(([s, c], i) => {
    text(s, xs[0] + 22, 280 + i * 32, { size: 15, font: MONO, color: c, alpha: seg(t, a0 + 1.0 + i * 0.5, a0 + 1.4 + i * 0.5) });
  });
  text(S.ex, xs[0] + 22, 470, { size: 13, font: MONO, color: HR.faint, alpha: kA });
  ["marketplace.json", "{ \"name\": \"acme\",", "  \"repo\": \"https://github.com/…\",", "  \"versions\": {", "    \"0.1.0\": \"9b1e4c7d…\" },", "  \"tier\": \"community\" }"].forEach((s, i) => {
    text(s, xs[1] + 22, 275 + i * 28, { size: i === 0 ? 13 : 14, font: MONO, color: i === 0 ? HR.faint : i === 4 ? HR.goldHi : HR.cream, alpha: seg(t, a0 + 2.8 + i * 0.15, a0 + 3.2 + i * 0.15) });
  });
  text(S.ex, xs[1] + 22, 470, { size: 13, font: MONO, color: HR.faint, alpha: kB });
  S.ci.forEach((s, i) => {
    const k = seg(t, a1 + 0.5 + i * 0.5, a1 + 0.9 + i * 0.5), y = 290 + i * 46;
    check(xs[2] + 32, y - 6, 15, HR.leaf, k);
    text(s, xs[2] + 52, y, { size: 16, font: SANS, color: HR.cream, alpha: k });
  });
}

/* 7. Outro: anyone installs it, and reads its permissions first. */
function sOutro(t, d, cues) {
  title(S.h_out, seg(t, 0.1, 0.8));
  permCard(80, 190, 640, "horae plugin add acme@0.1.0", S.desc,
    [["tier", "community · runs in a container"], ["intents", "task.create"], ["network", "none"], ["secrets", "none"]],
    seg(t, 0.4, 2.2), { ask: S.ask });
  text(S.ex, 700, 228, { size: 13, font: MONO, color: "#7a6f8f", align: "right", alpha: seg(t, 0.8, 1.4) });
  mark(990, 330, 220, seg(t, 1.0, 2.6));
  text(S.url, 990, 500, { size: 18, font: MONO, weight: 600, color: HR.gold, align: "center", alpha: seg(t, 2.0, 2.6) });
}

VIDEO.create({
  title: { en: "Writing a plugin", fr: "Écrire un plugin" },
  kicker: { en: "Horae · narrated tour", fr: "Horae · visite commentée" },
  langs: ["en", "fr"],
  theme: HR_THEME,
  strings: STR,
  background: () => hrSky(0),
  fonts: HR_FONTS,
  poster: "code",
  scenes: { intro: sIntro, template: sTemplate, manifest: sManifest, code: sCode, tests: sTests, publish: sPublish, outro: sOutro },
});
