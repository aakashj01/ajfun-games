Arcade.register({
  id: "hold-still",
  title: "Hold Still",
  cat: "skill",
  color: "--t-sky",
  spec: "00.000s",
  blurb: "Keep your cursor perfectly still. A seismograph records every wobble of your hand.",
  mount(root, ctx) {
    const LIMIT = 6; // px of drift allowed
    const TAUNTS = [
      "A fly just landed on your mouse.", "Don't think about your nose.", "Is that an itch?",
      "Your phone buzzed. Probably.", "Breathe normally. No, not like that.", "Someone said your name.",
      "Your foot is asleep.", "There's a spider. Behind you. Small one.", "You left the stove on? Kidding.",
      "Blink. Wait, don't.", "Your hand is getting heavier.", "This is the hardest part.",
      "The circle is judging you.", "Sneeze incoming?", "Did you hear that?",
    ];
    const RANKS = [
      [2, "Caffeinated squirrel"], [5, "Espresso enthusiast"], [10, "Ordinary human"],
      [20, "Surgeon in training"], [40, "Statue apprentice"], [90, "Houseplant"],
      [180, "Mountain"], [Infinity, "Literally a rock"],
    ];
    const best = () => Arcade.store.get("hold-still:best", 0);

    root.innerHTML = `
      <style>
        .hs { display: grid; gap: 20px; }
        .hs-arena { position: relative; display: grid; place-items: center; min-height: 380px; border-radius: 18px;
          background: radial-gradient(circle at 50% 50%, var(--surface) 0, var(--surface) 40%, var(--surface-2) 100%);
          border: 1px solid var(--line); overflow: hidden; user-select: none; touch-action: none; }
        .hs-zone { width: 220px; height: 220px; border-radius: 50%; border: 3px dashed var(--muted);
          display: grid; place-items: center; text-align: center; cursor: crosshair; position: relative;
          transition: border-color .2s, background .2s; }
        .hs-zone.live { border-style: solid; border-color: var(--accent); background: color-mix(in srgb, var(--accent) 8%, transparent); cursor: none; }
        .hs-zone.dead { border-color: var(--bad); background: color-mix(in srgb, var(--bad) 10%, transparent); }
        .hs-ring { position: absolute; border-radius: 50%; border: 2px solid var(--bad); pointer-events: none; opacity: 0; }
        .hs-time { font-size: clamp(44px, 9vw, 80px); font-weight: 700; line-height: 1; }
        .hs-hint { font-size: 14px; color: var(--muted); max-width: 160px; }
        .hs-taunt { position: absolute; top: 18px; left: 50%; transform: translateX(-50%); font-weight: 700; font-size: 18px;
          background: var(--fg); color: var(--bg); padding: 8px 14px; border-radius: 10px; opacity: 0; transition: opacity .3s; white-space: nowrap; max-width: calc(100% - 24px); overflow: hidden; text-overflow: ellipsis; }
        .hs-taunt.on { opacity: 1; }
        .hs-seis { width: 100%; height: 120px; display: block; border-radius: 12px; background: var(--surface); border: 1px solid var(--line); }
        .hs-row { display: flex; flex-wrap: wrap; gap: 24px; align-items: baseline; }
        .hs-stat b { display: block; font-size: 28px; }
        .hs-stat span { font-size: 12px; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); font-weight: 700; }
        .hs-verdict { font-size: 22px; font-weight: 700; min-height: 1.5em; }
      </style>
      <div class="hs">
        <div><h1 class="g-title">Hold Still</h1>
          <p class="g-lede">Click inside the circle, then don't move. Drift more than ${LIMIT} pixels and it's over. Leaving the window counts as moving.</p></div>
        <div class="hs-arena" id="arena">
          <div class="hs-taunt" id="taunt"></div>
          <div class="hs-zone" id="zone"><div><div class="hs-time mono" id="time">0.000</div><div class="hs-hint" id="hint">Click here to start</div></div></div>
          <div class="hs-ring" id="ring"></div>
        </div>
        <canvas class="hs-seis" id="seis" aria-label="Seismograph of your hand movement"></canvas>
        <div class="hs-row">
          <div class="hs-stat"><span>Your best</span><b class="mono" id="best">${best().toFixed(3)}s</b></div>
          <div class="hs-stat"><span>Rank</span><b id="rank">${rankFor(best())}</b></div>
          <div class="hs-verdict" id="verdict"></div>
        </div>
      </div>`;

    const $ = id => root.querySelector("#" + id);
    const zone = $("zone"), timeEl = $("time"), hint = $("hint"), ring = $("ring"), taunt = $("taunt"), verdict = $("verdict");
    const seis = $("seis");
    let sctx, sw = 0, sh = 120;
    function sizeSeis() { sw = seis.clientWidth; sctx = Arcade.canvasFit(seis, sw, sh); }
    sizeSeis(); ctx.on(window, "resize", sizeSeis);

    let state = "idle", anchor = null, t0 = 0, motion = 0, maxDrift = 0, tauntTimer = null;
    const samples = [];

    function rankFor(s) { return RANKS.find(r => s < r[0])[1]; }

    function startRun(e) {
      if (state === "live") return;
      state = "live"; anchor = { x: e.clientX, y: e.clientY }; t0 = performance.now(); motion = 0; maxDrift = 0;
      samples.length = 0;
      zone.classList.add("live"); zone.classList.remove("dead");
      hint.textContent = "Don't move."; verdict.textContent = "";
      scheduleTaunt(2500);
    }
    function scheduleTaunt(ms) {
      ctx.clear(tauntTimer);
      tauntTimer = ctx.timeout(() => {
        if (state !== "live") return;
        const el = (performance.now() - t0) / 1000;
        taunt.textContent = el > 30 && Math.random() < 0.3
          ? "Have you let go of the mouse? That's allowed. We're just disappointed."
          : TAUNTS[Math.floor(Math.random() * TAUNTS.length)];
        taunt.classList.add("on");
        ctx.timeout(() => taunt.classList.remove("on"), 1800);
        scheduleTaunt(2500 + Math.random() * 3500);
      }, ms);
    }
    function fail(reason) {
      if (state !== "live") return;
      state = "dead";
      const s = (performance.now() - t0) / 1000;
      timeEl.textContent = s.toFixed(3);
      zone.classList.remove("live"); zone.classList.add("dead");
      hint.textContent = "Click to try again";
      taunt.classList.remove("on");
      const r = rankFor(s);
      let msg = `${reason} You lasted ${s.toFixed(2)}s. Rank: ${r}.`;
      if (s > best()) { Arcade.store.set("hold-still:best", s); $("best").textContent = s.toFixed(3) + "s"; $("rank").textContent = r; msg += " New best."; Arcade.beep(880, .2, "triangle"); }
      else Arcade.beep(160, .3, "sawtooth", .12);
      verdict.textContent = msg;
      ring.style.opacity = 0;
    }

    ctx.on(zone, "pointerdown", e => { e.preventDefault(); startRun(e); });
    ctx.on(window, "pointermove", e => {
      if (state !== "live") return;
      const dx = e.clientX - anchor.x, dy = e.clientY - anchor.y;
      const d = Math.hypot(dx, dy);
      motion += Math.abs(e.movementX || 0) + Math.abs(e.movementY || 0) || 0.5;
      maxDrift = Math.max(maxDrift, d);
      const zr = zone.getBoundingClientRect(), ar = $("arena").getBoundingClientRect();
      const size = 12 + (d / LIMIT) * 40;
      ring.style.width = ring.style.height = size + "px";
      ring.style.left = (anchor.x - ar.left - size / 2) + "px"; ring.style.top = (anchor.y - ar.top - size / 2) + "px";
      ring.style.opacity = Math.min(1, d / LIMIT);
      if (d > LIMIT) fail(d > 60 ? "That wasn't even close." : "You moved.");
    });
    ctx.on(window, "blur", () => fail("You left the window."));
    ctx.on(document, "mouseleave", () => fail("You left the page."));
    ctx.on(document, "visibilitychange", () => { if (document.hidden) fail("You switched tabs."); });

    let lastSample = 0;
    ctx.raf(ts => {
      if (state === "live") timeEl.textContent = ((performance.now() - t0) / 1000).toFixed(3);
      if (ts - lastSample > 33) {
        lastSample = ts;
        samples.push(state === "live" ? motion : 0); motion = 0;
        const maxN = Math.floor(sw / 3); while (samples.length > maxN) samples.shift();
        drawSeis();
      }
    });
    function drawSeis() {
      if (!sctx) return;
      const fg = Arcade.css("--fg"), line = Arcade.css("--line"), bad = Arcade.css("--bad");
      sctx.clearRect(0, 0, sw, sh);
      sctx.strokeStyle = line; sctx.lineWidth = 1;
      for (let y = 20; y < sh; y += 20) { sctx.beginPath(); sctx.moveTo(0, y); sctx.lineTo(sw, y); sctx.stroke(); }
      sctx.strokeStyle = state === "dead" ? bad : fg; sctx.lineWidth = 1.5; sctx.beginPath();
      const mid = sh / 2, x0 = sw - samples.length * 3;
      samples.forEach((m, i) => {
        const amp = Math.min(mid - 4, m * 6) * (i % 2 ? 1 : -1);
        const x = x0 + i * 3;
        i ? sctx.lineTo(x, mid + amp) : sctx.moveTo(x, mid + amp);
      });
      sctx.stroke();
      sctx.fillStyle = Arcade.css("--muted"); sctx.font = "11px " + Arcade.css("--font-mono");
      sctx.fillText("HAND SEISMOGRAPH", 10, 16);
    }
  },
});
