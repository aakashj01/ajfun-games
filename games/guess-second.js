Arcade.register({
  id: "guess-the-second",
  title: "Guess the Second",
  cat: "skill",
  color: "--t-yolk",
  spec: "1.000<br>5.000<br>30.00",
  blurb: "Hold a button for exactly 1, 5, then 30 seconds. No clock. How good is your internal one?",
  mount(root, ctx) {
    const ROUNDS = [
      { t: 1, note: "Warm-up." },
      { t: 2, note: "Two. Easy." },
      { t: 5, note: "No counting Mississippis." },
      { t: 10, note: "With a metronome. The metronome lies.", liar: 0.77 },
      { t: 30, note: "The long one." },
    ];
    const VERDICTS = [
      [97, "Atomic clock. Are you a quartz crystal?"], [92, "Swiss watch."], [85, "Kitchen timer."],
      [75, "Sundial on a cloudy day."], [60, "Goldfish with a calendar."], [0, "Time is a concept you've heard of."],
    ];

    root.innerHTML = `
      <style>
        .gs { display: grid; gap: 22px; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); align-items: start; }
        @media (max-width: 820px) { .gs { grid-template-columns: 1fr; } }
        .gs-main { display: grid; gap: 18px; }
        .gs-press { display: grid; place-items: center; padding: 28px 16px; border-radius: 18px; background: var(--surface); border: 1px solid var(--line); }
        .gs-target { font-size: clamp(56px, 11vw, 110px); font-weight: 700; line-height: 1; }
        .gs-target small { font-size: .35em; color: var(--muted); }
        .gs-note { color: var(--muted); font-weight: 600; margin: 6px 0 22px; text-align: center; }
        .gs-btn { width: 200px; height: 200px; border-radius: 50%; border: none; cursor: pointer; user-select: none; touch-action: none;
          background: var(--t-yolk); color: var(--ink); font-family: var(--font-display); font-weight: 800; font-size: 24px;
          box-shadow: 0 10px 0 color-mix(in srgb, var(--t-yolk) 55%, #000); transition: transform .06s, box-shadow .06s; }
        .gs-btn.down { transform: translateY(8px); box-shadow: 0 2px 0 color-mix(in srgb, var(--t-yolk) 55%, #000); animation: gs-pulse 1.4s ease-in-out infinite; }
        .gs-btn:disabled { opacity: .4; cursor: default; }
        @keyframes gs-pulse { 50% { filter: brightness(1.12); } }
        .gs-result { min-height: 3em; font-size: 18px; font-weight: 600; text-align: center; margin-top: 18px; }
        .gs-side { padding: 18px; display: grid; gap: 12px; }
        .gs-side h3 { margin: 0; font-family: var(--font-display); font-size: 20px; }
        .gs-r { display: grid; grid-template-columns: 44px 1fr 70px; gap: 10px; align-items: center; font-size: 14px; }
        .gs-bar { position: relative; height: 14px; border-radius: 7px; background: var(--surface-2); overflow: visible; }
        .gs-bar i { position: absolute; top: -3px; bottom: -3px; width: 2px; left: 50%; background: var(--fg); }
        .gs-bar b { position: absolute; top: 0; bottom: 0; border-radius: 7px; }
        .gs-final { padding: 18px; border-radius: 14px; background: var(--fg); color: var(--bg); }
        .gs-final .big { font-size: 48px; font-weight: 700; line-height: 1; }
      </style>
      <div><h1 class="g-title">Guess the Second</h1>
        <p class="g-lede">Press and hold the button (or the space bar) for the target time, then let go. Five rounds. No clock on screen.</p></div>
      <div class="gs">
        <div class="gs-main">
          <div class="gs-press">
            <div class="gs-target mono" id="target"></div>
            <div class="gs-note" id="note"></div>
            <button class="gs-btn" id="btn">Hold</button>
            <div class="gs-result" id="result"></div>
          </div>
        </div>
        <aside class="panel gs-side">
          <h3>Your rounds</h3>
          <div class="muted" style="font-size:13px">Center line is perfect. Left is too short, right is too long.</div>
          <div id="rows" style="display:grid;gap:10px"></div>
          <div id="final"></div>
          <div class="muted" style="font-size:13px">Best accuracy: <b class="mono" id="best"></b></div>
        </aside>
      </div>`;

    const $ = id => root.querySelector("#" + id);
    const btn = $("btn");
    let round = 0, t0 = 0, holding = false, results = [], tick = null, done = false;
    const showBest = () => { const b = Arcade.store.get("guess-second:best", null); $("best").textContent = b == null ? "none yet" : b.toFixed(1) + "%"; };
    showBest();

    function setup() {
      const r = ROUNDS[round];
      $("target").innerHTML = `${r.t}<small>s</small>`;
      $("note").textContent = `Round ${round + 1} of ${ROUNDS.length}. ${r.note}`;
      btn.disabled = false; btn.textContent = "Hold";
    }
    function down(e) {
      if (holding || done || btn.disabled) return;
      e && e.preventDefault();
      holding = true; t0 = performance.now(); btn.classList.add("down"); btn.textContent = "…";
      const r = ROUNDS[round];
      if (r.liar) { Arcade.beep(1200, .03, "square", .08); tick = ctx.interval(() => Arcade.beep(1200, .03, "square", .08), r.liar * 1000); }
    }
    function up() {
      if (!holding) return;
      holding = false; ctx.clear(tick); btn.classList.remove("down");
      const held = (performance.now() - t0) / 1000, r = ROUNDS[round];
      const err = held - r.t, pct = Math.abs(err) / r.t * 100;
      results.push({ t: r.t, held, err, pct });
      const tone = pct < 3 ? "Uncanny." : pct < 10 ? "Nice." : pct < 25 ? "Meh." : err < 0 ? "Way too fast." : "Way too slow.";
      $("result").innerHTML = `You held <b class="mono">${held.toFixed(3)}s</b>. ${err < 0 ? "Short" : "Long"} by <b class="mono">${Math.abs(err).toFixed(3)}s</b> (${pct.toFixed(1)}%). ${tone}`;
      Arcade.beep(pct < 10 ? 880 : 330, .15, "triangle");
      renderRows();
      round++;
      btn.disabled = true;
      if (round < ROUNDS.length) ctx.timeout(setup, 900);
      else finish();
    }
    function renderRows() {
      $("rows").innerHTML = results.map(r => {
        const off = Math.max(-1, Math.min(1, r.err / r.t)); // -100%..100%
        const left = off < 0 ? 50 + off * 50 : 50, w = Math.abs(off) * 50;
        const col = r.pct < 5 ? "var(--good)" : r.pct < 20 ? "var(--t-yolk)" : "var(--bad)";
        return `<div class="gs-r"><span class="mono">${r.t}s</span><div class="gs-bar"><b style="left:${left}%;width:${Math.max(w, .8)}%;background:${col}"></b><i></i></div><span class="mono" style="text-align:right">${r.held.toFixed(2)}s</span></div>`;
      }).join("");
    }
    function finish() {
      done = true;
      const acc = Math.max(0, 100 - results.reduce((a, r) => a + r.pct, 0) / results.length);
      const v = VERDICTS.find(x => acc >= x[0])[1];
      const prev = Arcade.store.get("guess-second:best", null);
      if (prev == null || acc > prev) Arcade.store.set("guess-second:best", acc);
      showBest();
      $("target").innerHTML = `${acc.toFixed(1)}<small>%</small>`;
      $("note").textContent = "Internal clock accuracy";
      btn.textContent = "Again"; btn.disabled = false;
      $("final").innerHTML = `<div class="gs-final"><div class="big mono">${acc.toFixed(1)}%</div><div style="font-weight:700;margin-top:6px">${v}</div></div>`;
    }
    ctx.on(btn, "pointerdown", e => { if (done) { round = 0; results = []; done = false; $("rows").innerHTML = ""; $("final").innerHTML = ""; $("result").textContent = ""; setup(); return; } down(e); });
    ctx.on(window, "pointerup", up);
    ctx.on(window, "pointercancel", up);
    ctx.on(window, "keydown", e => { if (e.code === "Space" && !e.repeat) { e.preventDefault(); if (!done) down(); } });
    ctx.on(window, "keyup", e => { if (e.code === "Space") { e.preventDefault(); up(); } });
    ctx.on(window, "blur", up);
    setup();
  },
});
