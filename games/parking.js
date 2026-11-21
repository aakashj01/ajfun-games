Arcade.register({
  id: "parallel-parking",
  title: "Parallel Parking Simulator 3000",
  cat: "skill",
  color: "--t-tomato",
  spec: "HONK<br>HONK",
  blurb: "One car, one spot, physics that are a bit too real. Scored in honks from the people waiting behind you.",
  mount(root, ctx) {
    const W = 960, H = 540, CAR_L = 90, CAR_W = 36, WB = 54, REAR_TO_CENTER = 27;
    const CURB = 110, LANE_BOTTOM = 170, SPOT = { x0: 240, x1: 390 };
    const PARKED = [
      { x: 30, c: "#7A8CA8" }, { x: 150, c: "#C2564B" }, { x: 390, c: "#4E9A6B" }, { x: 650, c: "#D8A23A" }, { x: 770, c: "#6B5CA5" },
    ];
    const obstacles = [
      rect(-60, -60, W + 120, CURB + 60), rect(-60, 490, W + 120, 120),
      rect(-60, 0, 60, H), rect(W, 0, 60, H),
      ...PARKED.map(p => rect(p.x, 120, CAR_L, CAR_W)),
    ];
    function rect(x, y, w, h) { return [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }]; }

    root.innerHTML = `
      <style>
        .pk { display: grid; gap: 16px; }
        .pk canvas { width: min(100%, calc(64vh * 16 / 9)); justify-self: center; height: auto; aspect-ratio: 16 / 9; display: block; border-radius: 16px; background: #3A3D46; touch-action: none; }
        .pk-hud { display: flex; flex-wrap: wrap; gap: 10px 26px; align-items: center; }
        .pk-hud div span { display: block; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); font-weight: 700; }
        .pk-hud div b { font-size: 22px; }
        .pk-ctrl { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
        .pk-ctrl .btn { min-width: 56px; user-select: none; touch-action: none; }
        .pk-res { padding: 16px 18px; border-radius: 14px; background: var(--fg); color: var(--bg); font-weight: 600; }
        .pk-res .big { font-family: var(--font-display); font-size: 34px; font-weight: 800; line-height: 1.05; }
        .pk-keys kbd { font-family: var(--font-mono); font-size: 12px; border: 1px solid var(--line); border-bottom-width: 3px; border-radius: 6px; padding: 1px 6px; background: var(--surface); }
      </style>
      <div class="pk">
        <div><h1 class="g-title">Parallel Parking Simulator 3000</h1>
          <p class="g-lede pk-keys">Park in the gap between the red and green cars. <kbd>↑</kbd> <kbd>↓</kbd> drive and reverse, <kbd>←</kbd> <kbd>→</kbd> steer, <kbd>Enter</kbd> to declare yourself parked. Every bump costs honks.</p></div>
        <canvas id="cv" width="960" height="540" aria-label="Top-down street with a parking spot"></canvas>
        <div class="pk-hud">
          <div><span>Time</span><b class="mono" id="h-time">0.0s</b></div>
          <div><span>Gear</span><b class="mono" id="h-gear">P</b></div>
          <div><span>Bumps</span><b class="mono" id="h-bumps">0</b></div>
          <div><span>Best</span><b class="mono" id="h-best">–</b></div>
          <div class="pk-ctrl" style="margin-left:auto">
            <button class="btn" data-k="left" aria-label="Steer left">◀</button>
            <button class="btn" data-k="up" aria-label="Forward">▲</button>
            <button class="btn" data-k="down" aria-label="Reverse">▼</button>
            <button class="btn" data-k="right" aria-label="Steer right">▶</button>
            <button class="btn primary" id="park">I'm parked</button>
            <button class="btn" id="reset">Restart</button>
          </div>
        </div>
        <div id="res"></div>
      </div>`;

    const $ = id => root.querySelector("#" + id);
    const cv = $("cv");
    const g = Arcade.canvasFit(cv, W, H);
    const keys = { up: false, down: false, left: false, right: false };
    let car, time, started, bumps, lastBump, honks, finished;
    const best = () => Arcade.store.get("parking:best", null);
    const showBest = () => { const b = best(); $("h-best").textContent = b == null ? "–" : b + " honks"; };
    showBest();

    function reset() {
      car = { x: 80, y: 230, h: 0, v: 0, steer: 0 }; // x,y = rear axle
      time = 0; started = false; bumps = 0; lastBump = -1; honks = []; finished = false;
      $("res").innerHTML = ""; $("h-bumps").textContent = "0";
    }
    reset();

    function corners(c) {
      const cos = Math.cos(c.h), sin = Math.sin(c.h);
      const cx = c.x + cos * REAR_TO_CENTER, cy = c.y + sin * REAR_TO_CENTER;
      const hl = CAR_L / 2, hw = CAR_W / 2;
      return [[hl, hw], [hl, -hw], [-hl, -hw], [-hl, hw]].map(([a, b]) => ({ x: cx + cos * a - sin * b, y: cy + sin * a + cos * b }));
    }
    function sat(A, B) {
      for (const P of [A, B]) for (let i = 0; i < P.length; i++) {
        const p1 = P[i], p2 = P[(i + 1) % P.length], nx = p2.y - p1.y, ny = p1.x - p2.x;
        let aMin = Infinity, aMax = -Infinity, bMin = Infinity, bMax = -Infinity;
        for (const p of A) { const d = p.x * nx + p.y * ny; aMin = Math.min(aMin, d); aMax = Math.max(aMax, d); }
        for (const p of B) { const d = p.x * nx + p.y * ny; bMin = Math.min(bMin, d); bMax = Math.max(bMax, d); }
        if (aMax < bMin || bMax < aMin) return false;
      }
      return true;
    }
    function honk(n = 1) {
      for (let i = 0; i < n; i++) honks.push({ x: 80 + Math.random() * 800, y: 300 + Math.random() * 180, t: 0, d: i * 0.18 });
      Arcade.beep(392, .22, "sawtooth", .1); Arcade.beep(494, .22, "sawtooth", .08, .02);
    }

    function step(dt) {
      if (finished) return;
      if (!started && (keys.up || keys.down || keys.left || keys.right)) started = true;
      if (started) time += dt;
      const ACC = 90, BRAKE = 220, DRAG = 45;
      if (keys.up) car.v += (car.v < 0 ? BRAKE : ACC) * dt;
      else if (keys.down) car.v -= (car.v > 0 ? BRAKE : ACC) * dt;
      else car.v -= Math.sign(car.v) * Math.min(Math.abs(car.v), DRAG * dt);
      car.v = Math.max(-55, Math.min(130, car.v));
      const SR = 1.6, MAXS = 0.62;
      if (keys.left) car.steer -= SR * dt; else if (keys.right) car.steer += SR * dt;
      else car.steer -= Math.sign(car.steer) * Math.min(Math.abs(car.steer), 0.9 * dt);
      car.steer = Math.max(-MAXS, Math.min(MAXS, car.steer));

      const prev = { ...car };
      car.h += car.v / WB * Math.tan(car.steer) * dt;
      car.x += car.v * Math.cos(car.h) * dt;
      car.y += car.v * Math.sin(car.h) * dt;
      const poly = corners(car);
      if (obstacles.some(o => sat(poly, o))) {
        const hit = Math.abs(car.v);
        Object.assign(car, prev); car.v = 0;
        if (time - lastBump > 0.5 && hit > 3) { bumps++; lastBump = time; honk(hit > 50 ? 3 : 1); $("h-bumps").textContent = bumps; }
      }
      $("h-time").textContent = time.toFixed(1) + "s";
      $("h-gear").textContent = Math.abs(car.v) < 2 ? "P" : car.v > 0 ? "D" : "R";
    }

    function park() {
      if (finished) { reset(); return; }
      if (Math.abs(car.v) > 4) { Arcade.toast("Stop the car first."); return; }
      finished = true;
      const poly = corners(car);
      const inSpot = poly.every(p => p.x >= SPOT.x0 - 1 && p.x <= SPOT.x1 + 1 && p.y >= CURB && p.y <= LANE_BOTTOM + 2);
      let a = ((car.h % Math.PI) + Math.PI) % Math.PI; if (a > Math.PI / 2) a = Math.PI - a;
      const deg = a * 180 / Math.PI;
      const gapM = (Math.min(...poly.map(p => p.y)) - CURB) / 20;
      let total, lines = [], verdict;
      if (!inSpot) {
        total = 20 + bumps * 4;
        verdict = poly.some(p => p.y < LANE_BOTTOM) ? "Half in the spot is still in the road." : "That isn't a parking spot. That's the road.";
        lines.push(["Not in the spot", 20]);
        if (bumps) lines.push([`${bumps} bump${bumps > 1 ? "s" : ""}`, bumps * 4]);
      } else {
        const tHonk = Math.max(0, Math.floor((time - 20) / 4)), aHonk = Math.round(deg / 2), gHonk = gapM > 0.3 ? Math.round((gapM - 0.3) * 15) : 0;
        total = bumps * 4 + tHonk + aHonk + gHonk;
        lines.push([`${bumps} bump${bumps === 1 ? "" : "s"}`, bumps * 4], [`${time.toFixed(1)}s taken (20s is free)`, tHonk], [`${deg.toFixed(1)}° crooked`, aHonk], [`${gapM.toFixed(2)} m from the curb`, gHonk]);
        verdict = total === 0 ? "Flawless. A stranger applauded." : total <= 3 ? "Decent. One honk was probably unrelated." : total <= 8 ? "The street has opinions." : total <= 15 ? "Someone filmed it." : "Your parking is now a local legend.";
        const b = best(); if (b == null || total < b) { Arcade.store.set("parking:best", total); showBest(); }
      }
      honk(Math.min(12, total));
      $("res").innerHTML = `<div class="pk-res"><div class="big">${total} honk${total === 1 ? "" : "s"}. ${verdict}</div>
        <div style="margin-top:8px;display:grid;gap:2px;font-size:14px">${lines.map(([l, n]) => `<div class="mono">${Arcade.esc(l)}: +${n}</div>`).join("")}</div>
        <div style="margin-top:8px;font-size:14px;opacity:.75">Press Enter or Restart to try again.</div></div>`;
    }

    function drawCar(c, color, steer) {
      g.save();
      g.translate(c.x, c.y); g.rotate(c.h); g.translate(REAR_TO_CENTER, 0);
      const hl = CAR_L / 2, hw = CAR_W / 2;
      g.fillStyle = "#111";
      for (const [wx, wy, s] of [[-27, -hw, 0], [-27, hw, 0], [27, -hw, steer], [27, hw, steer]]) {
        g.save(); g.translate(wx, wy); g.rotate(s); g.fillRect(-8, -3.5, 16, 7); g.restore();
      }
      g.fillStyle = color; roundRect(-hl, -hw, CAR_L, CAR_W, 8); g.fill();
      g.fillStyle = "rgba(20,25,40,.55)"; roundRect(4, -hw + 5, 20, CAR_W - 10, 4); g.fill(); roundRect(-32, -hw + 5, 14, CAR_W - 10, 4); g.fill();
      g.fillStyle = "rgba(255,255,255,.18)"; roundRect(-16, -hw + 4, 18, CAR_W - 8, 3); g.fill();
      g.restore();
    }
    function roundRect(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

    function draw(dt) {
      g.fillStyle = "#3A3D46"; g.fillRect(0, 0, W, H);
      g.fillStyle = "#B9BCC6"; g.fillRect(0, 0, W, CURB); g.fillRect(0, 490, W, 50);
      g.strokeStyle = "#A4A8B4"; g.lineWidth = 1;
      for (let x = 0; x < W; x += 48) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, CURB); g.stroke(); g.beginPath(); g.moveTo(x, 490); g.lineTo(x, H); g.stroke(); }
      g.fillStyle = "#E2E4EA"; g.fillRect(0, CURB - 6, W, 6); g.fillRect(0, 490, W, 6);
      g.fillStyle = "#353841"; g.fillRect(0, CURB, W, LANE_BOTTOM - CURB);
      g.strokeStyle = "#D9DBE2"; g.lineWidth = 2; g.beginPath(); g.moveTo(0, LANE_BOTTOM); g.lineTo(W, LANE_BOTTOM); g.stroke();
      g.strokeStyle = "#F2C94C"; g.lineWidth = 3; g.setLineDash([26, 22]); g.beginPath(); g.moveTo(0, 330); g.lineTo(W, 330); g.stroke(); g.setLineDash([]);
      g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 2;
      for (const x of [SPOT.x0, SPOT.x1]) { g.beginPath(); g.moveTo(x, CURB); g.lineTo(x, LANE_BOTTOM); g.stroke(); }
      g.fillStyle = "rgba(255,255,255,.12)"; g.fillRect(SPOT.x0, CURB, SPOT.x1 - SPOT.x0, LANE_BOTTOM - CURB);
      g.fillStyle = "rgba(255,255,255,.55)"; g.font = "bold 13px " + Arcade.css("--font-mono"); g.textAlign = "center";
      g.fillText("YOUR SPOT", (SPOT.x0 + SPOT.x1) / 2, CURB + 34);
      for (const p of PARKED) drawCar({ x: p.x + CAR_L / 2 - REAR_TO_CENTER, y: 138, h: 0 }, p.c, 0);
      drawCar(car, "#FFD23F", car.steer);
      g.textAlign = "center"; g.font = "800 30px " + Arcade.css("--font-display");
      honks = honks.filter(h => h.t < 1.6);
      for (const h of honks) {
        h.t += dt; const t = h.t - h.d; if (t < 0) continue;
        g.globalAlpha = Math.max(0, 1 - t / 1.4); g.fillStyle = "#FF7A59";
        g.fillText("HONK", h.x, h.y - t * 50); g.globalAlpha = 1;
      }
    }

    let last = performance.now();
    ctx.raf(ts => { const dt = Math.min(0.05, (ts - last) / 1000); last = ts; step(dt); draw(dt); });

    const map = { ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down", ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right" };
    ctx.on(window, "keydown", e => {
      if (map[e.code]) { keys[map[e.code]] = true; e.preventDefault(); }
      if ((e.code === "Enter" || e.code === "Space") && !e.repeat) { e.preventDefault(); park(); }
    });
    ctx.on(window, "keyup", e => { if (map[e.code]) keys[map[e.code]] = false; });
    ctx.on(window, "blur", () => { for (const k in keys) keys[k] = false; });
    root.querySelectorAll("[data-k]").forEach(b => {
      ctx.on(b, "pointerdown", e => { e.preventDefault(); keys[b.dataset.k] = true; });
      for (const ev of ["pointerup", "pointerleave", "pointercancel"]) ctx.on(b, ev, () => keys[b.dataset.k] = false);
    });
    ctx.on($("park"), "click", e => { e.currentTarget.blur(); park(); });
    ctx.on($("reset"), "click", e => { e.currentTarget.blur(); reset(); });
  },
});
