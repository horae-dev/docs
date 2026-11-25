/* Horae landing: the Hours Dial.
   A 24-hour dial (sunrise left, noon top, sunset right). The hero dial rests at 07:00; the
   "A day with Horae" dial follows the scroll from 06:00 to 23:00, lights each pipeline at its
   hour and shows its run record. The sky warms through --dawn on .hr-home. */
(function () {
  "use strict";
  const home = document.getElementById("hr-home");
  if (!home) return;

  const PIPES = [
    { h: 6.5, lr: 128, id: "school-fr", title: "Homework, before breakfast",
      why: "Read-only PRONOTE and ÉcoleDirecte: today's homework and deadlines become tasks.",
      steps: ["collect", "rules", "llm:off", "act", "notify"],
      rec: ["+ 2 tasks   Tasks.assistant.md", "  cost $0.000   no model needed"] },
    { h: 7.25, lr: 100, id: "daily-brief", title: "The morning note",
      why: "Calendar, vault tasks and GitHub, ranked and worded by one bounded model call.",
      steps: ["collect", "transform", "llm", "act", "notify"],
      rec: ["+ vault/Daily/2026-11-25.assistant.md", "+ ntfy  \"3 things before 10:00\"  [Open] [Snooze]", "  cost $0.004   schema ok · budget $0.15"] },
    { h: 8.5, id: "gmail-triage", title: "Mail, rules first",
      why: "Your rules sort the obvious. The model only reads the human mail that asks for something.",
      steps: ["collect", "rules", "llm", "act", "notify"],
      rec: ["  41 messages · 38 by rules · 3 by the model", "+ 2 tasks   from requests", "  cost $0.002   read-only mailbox"] },
    { h: 12.5, id: "github", title: "Reviews waiting for you",
      why: "Review requests, assignments, mentions and failing CI, as tasks with their links.",
      steps: ["collect", "rules", "llm:off", "act"],
      rec: ["+ 1 task   review horae-dev/horae pull request", "  cost $0.000"] },
    { h: 18, id: "homeassistant", title: "The house checks in",
      why: "Sensors and calendars become household reminders: bins out, a window left open.",
      steps: ["collect", "rules", "llm:off", "notify"],
      rec: ["+ ntfy  \"Bins out tonight (yellow)\"", "  cost $0.000"] },
    { h: 21.5, id: "reminders", title: "Nothing left behind",
      why: "Overdue nudges and tomorrow's digest from the vault. No model at all.",
      steps: ["collect", "rules", "act", "notify"],
      rec: ["~ 1 task moved to tomorrow", "  journaled · horae undo <run> restores it"] },
  ];
  const NS = "http://www.w3.org/2000/svg";
  const R = 210;
  const ROMAN = ["XXIV", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII",
    "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI", "XXII", "XXIII"];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const angle = (h) => ((h - 12) / 24) * 360 - 90; // noon at the top
  const pt = (h, r) => { const a = angle(h) * Math.PI / 180; return [Math.cos(a) * r, Math.sin(a) * r]; };
  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function build(svg) {
    el("circle", { r: R + 42, class: "ring", "stroke-width": 1 }, svg);
    el("circle", { r: R, class: "ring", "stroke-width": 1.5 }, svg);
    el("circle", { r: R - 60, class: "ring", "stroke-width": 1, "stroke-dasharray": "2 6" }, svg);
    for (let i = 0; i < 96; i++) {
      const h = i / 4, major = i % 4 === 0;
      const [a, b] = pt(h, R), [c, d] = pt(h, R - (major ? 14 : 6));
      el("line", { x1: a, y1: b, x2: c, y2: d, class: "tick" + (major ? " major" : "") }, svg);
    }
    for (let h = 0; h < 24; h += 3) {
      const side = h === 6 || h === 18, [x, y] = pt(h, side ? R + 12 : R + 21);
      const attrs = { x, y, class: "num" + (h % 6 ? " minor" : "") };
      if (side) attrs["text-anchor"] = h === 18 ? "start" : "end";
      el("text", attrs, svg).textContent = ROMAN[h];
    }
    const arc = el("path", { class: "arc", d: "" }, svg);
    const hand = el("line", { class: "hand", x1: 0, y1: 0, x2: 0, y2: -(R - 24) }, svg);
    const sun = el("circle", { class: "sun", r: 6 }, svg);
    const pips = PIPES.map((p) => {
      const g = el("g", { class: "pip" }, svg);
      const [x, y] = pt(p.h, R - 60);
      el("circle", { class: "halo", cx: x, cy: y, r: 7 }, g);
      el("circle", { cx: x, cy: y, r: 7 }, g);
      const [lx, ly] = pt(p.h, p.lr || R - 92);
      el("text", { x: lx, y: ly, "text-anchor": lx > 8 ? "end" : lx < -8 ? "start" : "middle", "dominant-baseline": "central" }, g).textContent = p.id;
      return g;
    });
    el("circle", { r: 9, fill: "var(--hr-gold)" }, svg);
    el("circle", { r: 3.5, fill: "var(--hr-night)" }, svg);
    return { arc, hand, sun, pips };
  }

  function setTime(d, h) {
    d.hand.setAttribute("transform", `rotate(${angle(h) + 90})`);
    const [sx, sy] = pt(h, R + 42); d.sun.setAttribute("cx", sx); d.sun.setAttribute("cy", sy);
    const s = 6, [x0, y0] = pt(s, R), [x1, y1] = pt(h, R), large = (h - s) / 24 > 0.5 ? 1 : 0;
    d.arc.setAttribute("d", h <= s + 0.01 ? "" : `M${x0} ${y0} A${R} ${R} 0 ${large} 1 ${x1} ${y1}`);
    d.pips.forEach((g, i) => {
      const p = PIPES[i];
      g.classList.toggle("on", h >= p.h && h < p.h + 1.2);
      g.classList.toggle("done", h >= p.h + 1.2);
    });
  }

  const hero = build(document.getElementById("hr-dial-hero"));
  setTime(hero, 7.7);

  const daySvg = document.getElementById("hr-dial-day");
  const section = document.getElementById("hr-day");
  if (!daySvg || !section) return;
  const day = build(daySvg);
  const card = document.getElementById("hr-run");
  const clock = document.getElementById("hr-clock");
  const sub = document.getElementById("hr-clock-sub");

  const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  function render(p) {
    card.classList.remove("swap"); void card.offsetWidth; if (!reduce) card.classList.add("swap");
    if (!p) {
      const next = PIPES.find((p) => p.h > lastH) || PIPES[0];
      const hh = Math.floor(next.h), mm = Math.round((next.h - hh) * 60);
      card.innerHTML = `<h3>Between runs</h3><p>No pipeline is due. Horae waits, and a run that finds nothing new costs nothing.</p>
        <div class="hr-record"><span class="meta">scheduler · idle · 0 model calls</span>\n  next  ${next.id}  ${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}  ${next.steps.filter((x) => !x.endsWith(":off")).join(" → ")}</div>`;
      return;
    }
    const steps = p.steps.map((s) => {
      const off = s.endsWith(":off"), n = s.replace(":off", "");
      return `<span class="${n === "llm" ? "llm" : ""} ${off ? "off" : ""}">${n}</span>`;
    }).join("");
    const rec = p.rec.map((l) => {
      const t = esc(l);
      return l.startsWith("+") ? `<span class="add">${t}</span>` : l.startsWith("~") ? `<span class="mod">${t}</span>` : t;
    }).join("\n");
    card.innerHTML = `<h3>${p.title}</h3><p>${p.why}</p><div class="hr-steps">${steps}</div>
      <div class="hr-record"><span class="meta">run ${p.id} · dry-run ok · applied · journaled</span>\n${rec}</div>`;
  }

  let last;
  let lastH = 6;
  let ticking = false;
  function update() {
    ticking = false;
    const r = section.getBoundingClientRect();
    const span = Math.max(1, r.height - innerHeight);
    const t = Math.min(1, Math.max(0, -r.top / span));
    const h = 6 + t * 17;
    lastH = h;
    setTime(day, h);
    const inView = r.top < innerHeight && r.bottom > 0;
    const bump = (c, w) => Math.max(0, 1 - Math.abs(h - c) / w);
    const sky = { "--dawn": bump(7, 2.5), "--day": bump(13, 6.5), "--dusk": bump(19, 2.5) };
    for (const k in sky) home.style.setProperty(k, inView ? sky[k].toFixed(3) : "0");
    const hh = Math.floor(h), mm = Math.floor(((h - hh) * 60) / 15) * 15;
    clock.textContent = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    let cur = null;
    for (const p of PIPES) if (h >= p.h - 0.05) cur = p;
    if (cur && h > cur.h + 1.6) cur = null;
    if (cur !== last) { last = cur; render(cur); }
    const caption = cur ? `${cur.id} is running.` : h < 6.4 ? "Before dawn. Nothing scheduled, nothing spent." : "Between runs. Nothing spent.";
    if (sub.textContent !== caption) sub.textContent = caption;
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener("resize", update);
  update();

  // a sparse night sky, drawn once
  const stars = document.getElementById("hr-stars");
  if (stars) {
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 90; i++) {
      el("circle", { cx: (rnd() * 100).toFixed(2) + "%", cy: (rnd() * 62).toFixed(2) + "%", r: (rnd() * 1.1 + 0.2).toFixed(2),
        fill: "#f3eee4", opacity: (rnd() * 0.6 + 0.2).toFixed(2) }, stars);
    }
  }
})();
