Arcade.register({
  id: "everything-falling",
  title: "Everything Falling",
  cat: "scale",
  color: "--t-pink",
  spec: "↓ 10 km",
  blurb: "Drop a feather, a cat and an anvil from 10 kilometers up, in real time. One lands in 95 seconds. One takes all day.",
  mount(root, ctx) {
    const H = 10000, G = 9.81, LN2 = Math.log(2);
    // terminal velocities in m/s at sea level, rough estimates
    const OBJ = [
      ["Cartoon anvil", "🪨", 115], ["Skydiver, head down", "🧑‍🚀", 90], ["Bowling ball", "🎳", 80], ["Skydiver, belly down", "🪂", 55],
      ["Baseball", "⚾", 42], ["Cat", "🐈", 27], ["Penny", "🪙", 11], ["Ping-pong ball", "🏓", 9.5], ["Raindrop", "💧", 9],
      ["Sheet of paper", "📄", 1.5], ["Snowflake", "❄️", 1], ["Feather", "🪶", 0.6], ["Dandelion seed", "🌼", 0.3],
    ].map(([name, icon, vt]) => ({ name, icon, vt, tLand: landTime(vt) }));
    function lncosh(z) { return z > 20 ? z - LN2 : Math.log(Math.cosh(z)); }
    function fallen(vt, t) { return vt * vt / G * lncosh(G * t / vt); }
    function speed(vt, t) { return vt * Math.tanh(G * t / vt); }
    function landTime(vt) { const x = H * G / (vt * vt); return x > 40 ? H / vt + vt / G * LN2 : vt / G * Math.acosh(Math.exp(x)); }
    const fmt = s => { s = Math.max(0, s); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), sec = Math.floor(s % 60); return h ? `${h}h ${String(m).padStart(2, "0")}m ${String(sec).padStart(2, "0")}s` : m ? `${m}m ${String(sec).padStart(2, "0")}s` : `${(s).toFixed(1)}s`; };

    root.innerHTML = `
      <style>
        .ef { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 380px); gap: 20px; align-items: start; }
        @media (max-width: 900px) { .ef { grid-template-columns: 1fr; } }
        .ef canvas { width: 100%; height: 560px; display: block; border-radius: 16px; background: var(--surface); border: 1px solid var(--line); }
        .ef-ctrl { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 16px 0; }
        .ef-clock { font-size: 30px; font-weight: 700; margin-right: 10px; }
        .ef-tbl { width: 100%; border-collapse: collapse; font-size: 14px; }
        .ef-tbl th { text-align: left; font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); padding: 6px 8px; border-bottom: 1px solid var(--line); }
        .ef-tbl td { padding: 6px 8px; border-bottom: 1px solid var(--line); font-variant-numeric: tabular-nums; white-space: nowrap; }
        .ef-tbl td:first-child { white-space: normal; }
        .ef-tbl tr.landed td { color: var(--muted); }
        .ef-tbl tr.landed td:last-child { color: var(--good); font-weight: 700; }
        .ef-wrap { overflow-x: auto; }
      </style>
      <h1 class="g-title">Everything Falling</h1>
      <p class="g-lede">Thirteen objects, dropped together from 10 km, about where airliners cruise. Time runs for real unless you speed it up.</p>
      <div class="ef-ctrl">
        <span class="ef-clock mono" id="clock">0.0s</span>
        <button class="btn primary" id="drop">Drop everything</button>
        <span class="muted" style="font-weight:700;font-size:13px">SPEED</span>
        ${[1, 10, 100, 1000].map(s => `<button class="chip" data-sp="${s}" aria-pressed="${s === 1}">${s}×</button>`).join("")}
        <button class="btn" id="skip">Skip to next landing</button>
      </div>
      <div class="ef">
        <canvas id="cv" aria-label="Objects falling from 10 kilometers"></canvas>
        <div class="panel ef-wrap"><table class="ef-tbl"><thead><tr><th>Object</th><th>Altitude</th><th>Speed</th><th>Lands</th></tr></thead><tbody id="tb"></tbody></table></div>
      </div>
      <p class="muted" style="font-size:13px;max-width:70ch;margin-top:14px">Speeds are rough terminal-velocity estimates in still air at sea-level density. Real objects fall faster high up, where the air is thinner, and wind would carry the light ones for miles.</p>`;

    const $ = id => root.querySelector("#" + id);
    const cv = $("cv");
    let g, W = 0, Hc = 560, t = 0, running = false, speedX = 1;
    function size() { W = cv.clientWidth; g = Arcade.canvasFit(cv, W, Hc); }
    size(); ctx.on(window, "resize", size);

    function rows() {
      $("tb").innerHTML = OBJ.map((o, i) => {
        const landed = running && t >= o.tLand;
        const alt = !running ? H : Math.max(0, H - fallen(o.vt, t));
        const v = !running ? 0 : landed ? 0 : speed(o.vt, t) * 3.6;
        return `<tr class="${landed ? "landed" : ""}"><td>${o.icon} ${o.name}</td><td class="mono">${(alt / 1000).toFixed(alt < 1000 ? 3 : 2)} km</td><td class="mono">${v.toFixed(v < 10 ? 1 : 0)} km/h</td><td class="mono">${landed ? "✓ " + fmt(o.tLand) : fmt(o.tLand)}</td></tr>`;
      }).join("");
    }

    function draw() {
      const fg = Arcade.css("--fg"), muted = Arcade.css("--muted"), line = Arcade.css("--line");
      g.clearRect(0, 0, W, Hc);
      const top = 26, ground = Hc - 30, left = 52, lane = (W - left - 10) / OBJ.length;
      g.font = "11px " + Arcade.css("--font-mono"); g.fillStyle = muted; g.textAlign = "right";
      for (let km = 0; km <= 10; km += 2) {
        const y = ground - (km / 10) * (ground - top);
        g.fillText(km + " km", left - 8, y + 4);
        g.strokeStyle = line; g.lineWidth = 1; g.beginPath(); g.moveTo(left, y); g.lineTo(W - 10, y); g.stroke();
      }
      g.fillStyle = Arcade.css("--t-lime"); g.fillRect(left, ground, W - left - 10, 6);
      g.textAlign = "center"; g.font = Math.max(14, Math.min(26, lane * 0.6)) + "px system-ui, sans-serif";
      OBJ.forEach((o, i) => {
        const alt = running ? Math.max(0, H - fallen(o.vt, t)) : H;
        const x = left + lane * (i + .5), y = ground - (alt / H) * (ground - top) - 4;
        if (running && t < o.tLand) { g.strokeStyle = line; g.setLineDash([2, 4]); g.beginPath(); g.moveTo(x, top); g.lineTo(x, y - 14); g.stroke(); g.setLineDash([]); }
        g.fillText(o.icon, x, y);
      });
      g.fillStyle = fg; g.font = "600 12px " + Arcade.css("--font-body"); g.textAlign = "left";
      const landed = OBJ.filter(o => running && t >= o.tLand).length;
      g.fillText(running ? `${landed} of ${OBJ.length} landed` : "Ready at 10 km", left, 16);
    }

    let last = performance.now(), rowT = 0;
    ctx.raf(ts => {
      const dt = Math.min(0.1, (ts - last) / 1000); last = ts;
      if (running) {
        const before = t; t += dt * speedX;
        OBJ.forEach(o => { if (before < o.tLand && t >= o.tLand) { Arcade.beep(200 + o.vt * 4, .12, "triangle", .08); } });
        $("clock").textContent = fmt(t);
      }
      draw();
      if (ts - rowT > 120) { rowT = ts; rows(); }
    });
    rows();
    ctx.on($("drop"), "click", () => { t = 0; running = true; $("drop").textContent = "Drop again"; $("clock").textContent = "0.0s"; });
    root.querySelectorAll("[data-sp]").forEach(b => ctx.on(b, "click", () => {
      speedX = +b.dataset.sp; root.querySelectorAll("[data-sp]").forEach(x => x.setAttribute("aria-pressed", x === b));
    }));
    ctx.on($("skip"), "click", () => {
      if (!running) { running = true; t = 0; $("drop").textContent = "Drop again"; }
      const next = OBJ.map(o => o.tLand).filter(x => x > t).sort((a, b) => a - b)[0];
      if (next != null) t = next - 1.5;
    });
  },
});
