Arcade.register({
  id: "ant-farm-tycoon",
  title: "Ant Farm Tycoon",
  cat: "idle",
  color: "--t-peach",
  spec: "· ·· ·<br>·· · ··",
  blurb: "Feed a tiny ant colony. It grows. Then it gets hungry for the interface and starts eating the game.",
  mount(root, ctx) {
    root.innerHTML = `
      <style>
        .af { position: relative; height: min(640px, 75vh); min-height: 460px; border-radius: 18px; overflow: hidden; cursor: crosshair; user-select: none;
          background: #E9D3A8; border: 1px solid #C9AE7C; color: #3B2A14; }
        .af canvas { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 3; pointer-events: none; }
        .af-ui { position: absolute; z-index: 2; }
        .af-title { left: 20px; top: 16px; font-family: var(--font-display); font-weight: 800; font-size: clamp(28px, 5vw, 46px); line-height: 1; max-width: 60%; }
        .af-sub { left: 22px; top: calc(16px + clamp(28px, 5vw, 46px) + 10px); font-weight: 600; font-size: 15px; max-width: 55%; }
        .af-stats { right: 18px; top: 18px; text-align: right; font-family: var(--font-mono); font-weight: 700; font-size: 14px; display: grid; gap: 4px; }
        .af-stats .n { font-size: 30px; }
        .af-btns { left: 20px; bottom: 18px; display: flex; gap: 8px; flex-wrap: wrap; }
        .af-btn { border: 2px solid #3B2A14; background: #F6E7C6; color: #3B2A14; border-radius: 10px; padding: 8px 14px; font-weight: 700; cursor: pointer; }
        .af-btn:disabled { opacity: .5; cursor: not-allowed; }
        .af-nest { position: absolute; z-index: 1; left: 50%; bottom: 14px; width: 70px; height: 34px; margin-left: -35px; border-radius: 50% 50% 10px 10px; background: #8A6A3A; box-shadow: inset 0 -8px 0 #5E4522; }
        .af-end { position: absolute; inset: 0; z-index: 4; display: grid; place-items: center; text-align: center; background: rgba(59,42,20,.82); color: #F6E7C6; padding: 20px; }
        .af-end .big { font-family: var(--font-display); font-weight: 800; font-size: clamp(30px, 6vw, 54px); line-height: 1.05; }
        .ed { display: inline-block; }
      </style>
      <h1 class="g-title" style="margin-bottom:6px">Ant Farm Tycoon</h1>
      <p class="g-lede" style="margin-bottom:16px">Click the sand to drop crumbs. Every 3 crumbs brought home hatches a new ant. Past 40 ants, they start getting curious about the interface.</p>
      <div class="af" id="af">
        <div class="af-nest"></div>
        <div class="af-ui af-title" id="t1">Ant Farm Tycoon</div>
        <div class="af-ui af-sub" id="t2">Your colony is thriving. Please do not let it read this.</div>
        <div class="af-ui af-stats"><div><span class="n" id="n-ants">0</span> <span class="lab">ants</span></div><div id="n-food">food stored: 0</div><div id="mood">mood: content</div></div>
        <div class="af-ui af-btns"><button class="af-btn" id="sugar">Drop a sugar cube</button><button class="af-btn" id="spray">Spray the colony</button></div>
        <canvas id="cv"></canvas>
      </div>`;

    const $ = id => root.querySelector("#" + id);
    const box = $("af"), cv = $("cv");
    let W = 0, H = 0, g;
    function size() { W = box.clientWidth; H = box.clientHeight; g = Arcade.canvasFit(cv, W, H); }
    size(); ctx.on(window, "resize", size);

    // turn the interface into edible letters
    function edible(el) {
      const walk = node => {
        [...node.childNodes].forEach(c => {
          if (c.nodeType === 3) {
            const frag = document.createDocumentFragment();
            [...c.textContent].forEach(ch => { if (ch === " ") frag.appendChild(document.createTextNode(" ")); else { const s = document.createElement("span"); s.className = "ed"; s.textContent = ch; frag.appendChild(s); } });
            c.replaceWith(frag);
          } else if (c.nodeType === 1 && !c.classList.contains("n")) walk(c);
        });
      };
      walk(el);
    }
    ["t1", "t2", "sugar", "spray"].forEach(id => edible($(id)));
    edible(root.querySelector(".af-stats .lab"));
    const letters = () => [...box.querySelectorAll(".ed")].filter(s => !s.dataset.gone && !s.dataset.claimed);

    const nest = () => ({ x: W / 2, y: H - 30 });
    let ants = [], crumbs = [], food = 0, delivered = 0, over = false, sugarCd = 0, sprayCd = 0;
    function spawn(n = 1) { for (let i = 0; i < n && ants.length < 400; i++) { const p = nest(); ants.push({ x: p.x + (Math.random() - .5) * 20, y: p.y, a: -Math.PI / 2 + (Math.random() - .5), st: "search", carry: null, tgt: null }); } }
    spawn(6);

    ctx.on(box, "click", e => {
      if (over || e.target.closest("button")) return;
      const r = box.getBoundingClientRect();
      crumbs.push({ x: e.clientX - r.left, y: e.clientY - r.top, n: 5 });
    });
    ctx.on($("sugar"), "click", () => {
      if (sugarCd > 0) return;
      crumbs.push({ x: 60 + Math.random() * (W - 120), y: 120 + Math.random() * (H - 240), n: 40, big: true }); sugarCd = 8;
    });
    ctx.on($("spray"), "click", () => {
      if (sprayCd > 0 || ants.length < 4) return;
      const keep = Math.ceil(ants.length / 2);
      ants.slice(keep).forEach(a => { if (a.tgt && a.tgt.el) delete a.tgt.el.dataset.claimed; });
      ants = ants.slice(0, keep); sprayCd = 20; Arcade.toast("Sprayed. Half the colony left, offended.");
    });
    ctx.interval(() => { if (!over && crumbs.length < 30) crumbs.push({ x: 40 + Math.random() * (W - 80), y: 110 + Math.random() * (H - 200), n: 3 }); }, 5000);

    function steer(a, tx, ty, rate) {
      const want = Math.atan2(ty - a.y, tx - a.x); let d = want - a.a;
      while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      a.a += Math.max(-rate, Math.min(rate, d));
    }
    function letterPos(el) { const r = el.getBoundingClientRect(), b = box.getBoundingClientRect(); return { x: r.left - b.left + r.width / 2, y: r.top - b.top + r.height / 2 }; }

    function step(dt) {
      sugarCd = Math.max(0, sugarCd - dt); sprayCd = Math.max(0, sprayCd - dt);
      const hungry = ants.length >= 40;
      for (const a of ants) {
        const sp = 55 * dt;
        if (a.st === "search") {
          let best = null, bd = 260;
          for (const c of crumbs) { const d = Math.hypot(c.x - a.x, c.y - a.y); if (d < bd) { bd = d; best = c; } }
          if (best) {
            steer(a, best.x, best.y, 0.25);
            if (bd < 5) { best.n--; a.st = "home"; a.carry = "food"; if (best.n <= 0) crumbs.splice(crumbs.indexOf(best), 1); }
          } else {
            a.a += (Math.random() - .5) * 0.6;
            if (hungry && Math.random() < 0.004 * Math.min(4, ants.length / 40)) {
              const L = letters(); if (L.length) { const el = L[Math.floor(Math.random() * L.length)]; el.dataset.claimed = "1"; a.st = "eat"; a.tgt = { el }; }
            }
          }
        } else if (a.st === "eat") {
          const el = a.tgt.el;
          if (!el.isConnected || el.dataset.gone) { a.st = "search"; a.tgt = null; }
          else {
            const p = letterPos(el); steer(a, p.x, p.y, 0.3);
            if (Math.hypot(p.x - a.x, p.y - a.y) < 6) {
              el.dataset.gone = "1"; el.style.visibility = "hidden"; a.carry = el.textContent; a.st = "home"; a.tgt = null;
              checkButtons();
            }
          }
        } else if (a.st === "home") {
          const n = nest(); steer(a, n.x, n.y, 0.25);
          if (Math.hypot(n.x - a.x, n.y - a.y) < 12) {
            food++; delivered++; a.carry = null; a.st = "search"; a.a += Math.PI;
            if (delivered % 3 === 0) spawn(1);
          }
        }
        a.x += Math.cos(a.a) * sp; a.y += Math.sin(a.a) * sp;
        if (a.x < 4 || a.x > W - 4) { a.a = Math.PI - a.a; a.x = Math.max(4, Math.min(W - 4, a.x)); }
        if (a.y < 4 || a.y > H - 4) { a.a = -a.a; a.y = Math.max(4, Math.min(H - 4, a.y)); }
      }
      if (!over && box.querySelectorAll(".ed").length && !box.querySelectorAll(".ed:not([data-gone])").length) end();
    }
    function checkButtons() {
      ["sugar", "spray"].forEach(id => { const b = $(id); if (b && !b.querySelector(".ed:not([data-gone])")) { b.disabled = true; b.style.visibility = "hidden"; } });
    }

    function draw() {
      g.clearRect(0, 0, W, H);
      for (const c of crumbs) { g.fillStyle = c.big ? "#FFFFFF" : "#F7C85A"; const s = c.big ? Math.max(5, Math.sqrt(c.n) * 2.2) : 2 + c.n * 0.5; g.fillRect(c.x - s / 2, c.y - s / 2, s, s); }
      for (const a of ants) {
        const cx = Math.cos(a.a), sy = Math.sin(a.a);
        g.fillStyle = "#2A1A0B";
        g.beginPath(); g.arc(a.x - cx * 3.5, a.y - sy * 3.5, 2.4, 0, 7); g.fill();
        g.beginPath(); g.arc(a.x, a.y, 1.8, 0, 7); g.fill();
        g.beginPath(); g.arc(a.x + cx * 3, a.y + sy * 3, 1.6, 0, 7); g.fill();
        if (a.carry === "food") { g.fillStyle = "#F7C85A"; g.fillRect(a.x + cx * 5.5 - 1.5, a.y + sy * 5.5 - 1.5, 3, 3); }
        else if (a.carry) { g.fillStyle = "#3B2A14"; g.font = "bold 10px " + Arcade.css("--font-display"); g.fillText(a.carry, a.x + cx * 6 - 3, a.y + sy * 6 + 3); }
      }
    }

    let last = performance.now(), statT = 0;
    ctx.raf(ts => {
      const dt = Math.min(0.05, (ts - last) / 1000); last = ts;
      step(dt); draw();
      if (ts - statT > 250) {
        statT = ts;
        $("n-ants").textContent = ants.length;
        const nf = $("n-food"); if (nf) nf.textContent = `food stored: ${food}`;
        const left = box.querySelectorAll(".ed:not([data-gone])").length, all = box.querySelectorAll(".ed").length;
        const md = $("mood"); if (md) md.textContent = "mood: " + (ants.length < 25 ? "content" : ants.length < 40 ? "restless" : left > all * 0.5 ? "eating the interface" : "unstoppable");
        if ($("sugar")) $("sugar").disabled = sugarCd > 0 || $("sugar").style.visibility === "hidden";
        if ($("spray")) $("spray").disabled = sprayCd > 0 || $("spray").style.visibility === "hidden";
      }
    });

    function end() {
      over = true;
      const best = Math.max(Arcade.store.get("ants:best", 0), ants.length); Arcade.store.set("ants:best", best);
      const el = document.createElement("div"); el.className = "af-end";
      el.innerHTML = `<div style="display:grid;gap:12px;justify-items:center"><div class="big">The ants have eaten the game.</div>
        <div>Final colony: <b>${ants.length}</b> ants. Largest colony in this browser: <b>${best}</b>.</div>
        <button class="af-btn" id="again">Start a new colony</button></div>`;
      box.appendChild(el);
      el.querySelector("#again").onclick = () => { location.hash = ""; requestAnimationFrame(() => location.hash = "ant-farm-tycoon"); };
    }
  },
});
