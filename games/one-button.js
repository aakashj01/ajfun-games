Arcade.register({
  id: "one-button",
  title: "One Button, Whole Internet",
  cat: "everyone",
  color: "--t-tomato",
  spec: "PRESS<br>(or reset)",
  blurb: "One shared counter for everyone who opens this page. Anyone can add to it. Anyone can reset it to zero.",
  mount(root, ctx) {
    root.innerHTML = `
      <style>
        .ob { display: grid; gap: 26px; justify-items: center; text-align: center; padding-block: 10px 20px; }
        .ob > * { max-width: 100%; min-width: 0; }
        .ob-total { font-family: var(--font-mono); font-weight: 700; font-size: clamp(64px, 15vw, 170px); line-height: .9; letter-spacing: -0.04em; font-variant-numeric: tabular-nums; }
        .ob-sub { color: var(--muted); font-weight: 600; font-size: 17px; }
        .ob-btn { width: min(260px, 70vw); aspect-ratio: 1; border-radius: 50%; border: none; cursor: pointer; background: radial-gradient(circle at 38% 32%, #FF9C80, #FF5A36 55%, #D93A18);
          color: #fff; font-family: var(--font-display); font-weight: 800; font-size: 34px; letter-spacing: .04em; box-shadow: 0 14px 0 #9E2A10, 0 18px 30px rgba(0,0,0,.2); transition: transform .05s, box-shadow .05s; user-select: none; touch-action: manipulation; }
        .ob-btn:active { transform: translateY(11px); box-shadow: 0 3px 0 #9E2A10, 0 5px 12px rgba(0,0,0,.2); }
        .ob-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; width: 100%; max-width: 760px; }
        .ob-stats div { padding: 12px 14px; text-align: left; }
        .ob-stats span { display: block; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); font-weight: 700; }
        .ob-stats b { font-size: 22px; }
        .ob-reset { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; align-items: center; }
        .ob-danger { border-color: var(--bad); color: var(--bad); }
        .ob-pop { position: fixed; pointer-events: none; font-family: var(--font-display); font-weight: 800; font-size: 22px; color: var(--t-tomato); animation: ob-pop .8s ease-out forwards; z-index: 20; }
        @keyframes ob-pop { to { transform: translateY(-60px); opacity: 0; } }
      </style>
      <div class="ob">
        <div><h1 class="g-title">One Button, Whole Internet</h1>
          <p class="g-lede" style="margin-inline:auto">Everyone who opens this page shares one number. Press the button to add one. Or press reset and erase everyone's work.</p></div>
        <div><div class="ob-total" id="total">0</div><div class="ob-sub" id="sub">presses since the last reset</div></div>
        <button class="ob-btn" id="press">PRESS</button>
        <div class="ob-stats">
          <div class="panel"><span>Since last reset</span><b class="mono" id="since">–</b></div>
          <div class="panel"><span>Record before a reset</span><b class="mono" id="record">–</b></div>
          <div class="panel"><span>People pressing this round</span><b class="mono" id="people">–</b></div>
          <div class="panel"><span>Your presses this round</span><b class="mono" id="mine">0</b></div>
        </div>
        <div class="ob-reset"><button class="btn ob-danger" id="reset">Reset to zero</button><span id="confirm" hidden><span id="confirm-text" style="font-weight:600;margin-right:8px"></span><button class="btn primary" id="reset-yes" style="background:var(--bad);border-color:var(--bad)">Erase it</button> <button class="btn" id="reset-no">Keep it</button></span></div>
        <div class="muted" style="font-size:14px;max-width:60ch" id="status">Connecting to the shared counter…</div>
      </div>`;
    const $ = id => root.querySelector("#" + id);
    const nf = new Intl.NumberFormat("en-US");
    let sh = null, live = false, state = { epoch: 0, resetAt: null, record: 0 }, others = new Map(), my = { epoch: 0, count: 0 }, dirty = false, writing = false, readOnly = false;
    let localCount = Arcade.store.get("button:local", 0);

    const total = () => live ? [...others.values()].reduce((a, d) => a + (d.epoch === state.epoch ? d.count : 0), 0) + (my.epoch === state.epoch ? my.count : 0) : localCount;
    const people = () => [...others.values()].filter(d => d.epoch === state.epoch && d.count > 0).length + (my.epoch === state.epoch && my.count > 0 ? 1 : 0);
    function dur(ms) { const s = Math.floor(ms / 1000); const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60); return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : m ? `${m}m ${s % 60}s` : `${s}s`; }

    function render() {
      $("total").textContent = nf.format(total());
      $("mine").textContent = nf.format(live ? (my.epoch === state.epoch ? my.count : 0) : localCount);
      if (live) {
        $("people").textContent = nf.format(people());
        $("record").textContent = nf.format(state.record || 0);
        $("since").textContent = state.resetAt ? dur(Date.now() - state.resetAt) : "never reset";
      }
    }

    function pop(e) {
      const el = document.createElement("div"); el.className = "ob-pop"; el.textContent = "+1";
      el.style.left = (e.clientX - 12 + (Math.random() - .5) * 40) + "px"; el.style.top = (e.clientY - 20) + "px";
      document.body.appendChild(el); setTimeout(() => el.remove(), 800);
    }
    ctx.on($("press"), "click", e => {
      if (readOnly) { Arcade.toast("You can watch the counter but your access doesn't allow pressing."); return; }
      Arcade.beep(300 + Math.min(900, total() % 900), .05, "square", .05); if (e.clientX) pop(e);
      if (live) { if (my.epoch !== state.epoch) my = { epoch: state.epoch, count: 0 }; my.count++; dirty = true; flushSoon(); }
      else { localCount++; Arcade.store.set("button:local", localCount); }
      render();
    });

    let flushT = null;
    function flushSoon() { if (!flushT) flushT = ctx.timeout(flush, 500); }
    async function flush() {
      flushT = null;
      if (!sh || writing || !dirty) { if (dirty) flushSoon(); return; }
      writing = true; dirty = false;
      try { await sh.db.doc("presses/" + sh.uid).set({ epoch: my.epoch, count: my.count, updatedAt: Date.now() }); }
      catch (err) { if (err && err.code === "invalid_argument") { readOnly = true; $("status").textContent = "You can watch the counter, but your access to this page doesn't allow pressing."; } else dirty = true; }
      writing = false; if (dirty) flushSoon();
    }
    ctx.onCleanup(() => { if (dirty && sh) sh.db.doc("presses/" + sh.uid).set({ epoch: my.epoch, count: my.count, updatedAt: Date.now() }).catch(() => {}); });

    ctx.on($("reset"), "click", () => {
      $("confirm-text").textContent = `Erase ${nf.format(total())} presses for everyone?`;
      $("confirm").hidden = false; $("reset").hidden = true;
    });
    ctx.on($("reset-no"), "click", () => { $("confirm").hidden = true; $("reset").hidden = false; });
    ctx.on($("reset-yes"), "click", async () => {
      $("confirm").hidden = true; $("reset").hidden = false;
      const t = total();
      Arcade.beep(120, .6, "sawtooth", .12);
      if (!live) { localCount = 0; Arcade.store.set("button:local", 0); render(); return; }
      const next = { epoch: (state.epoch || 0) + 1, resetAt: Date.now(), record: Math.max(state.record || 0, t), lastTotal: t };
      try { await sh.db.doc("button/state").set(next); state = next; my = { epoch: next.epoch, count: 0 }; render(); Arcade.toast(`You erased ${nf.format(t)} presses. Everyone saw it.`); }
      catch (err) { Arcade.toast(err && err.code === "invalid_argument" ? "Your access to this page doesn't allow resetting." : "The reset didn't go through. Try again."); }
    });

    (async () => {
      sh = await Arcade.shared();
      if (ctx.dead) return;
      if (!sh) { $("status").textContent = "The shared counter isn't available here, so this button only counts your own presses. Open the published version of this page to press with everyone."; render(); return; }
      if (sh.canWrite === false) { readOnly = true; }
      const slow = ctx.timeout(() => { if (!live) $("status").textContent = "Still trying to reach the shared counter…"; }, 10000);
      const u1 = sh.db.doc("button/state").onSnapshot(s => {
        const d = s.exists ? s.data() : { epoch: 0, resetAt: null, record: 0 };
        const prevEpoch = state.epoch;
        state = { epoch: d.epoch || 0, resetAt: d.resetAt || null, record: d.record || 0 };
        if (live && state.epoch !== prevEpoch && prevEpoch != null) Arcade.toast("Someone just reset the counter to zero.");
        render();
      }, () => {});
      const u2 = sh.db.collection("presses").limit(1000).onSnapshot(snap => {
        others = new Map();
        snap.docs.forEach(d => {
          const v = d.data() || {}; const rec = { epoch: v.epoch || 0, count: v.count || 0 };
          if (d.id === sh.uid) { if (!dirty && !writing && (rec.epoch > my.epoch || (rec.epoch === my.epoch && rec.count > my.count))) my = rec; }
          else others.set(d.id, rec);
        });
        if (!snap.metadata.fromCache) ctx.clear(slow);
        live = true;
        $("status").textContent = readOnly ? "You can watch the counter, but your access to this page doesn't allow pressing." : "Live. Every press here shows up for everyone with this page open.";
        render();
      }, () => { ctx.clear(slow); $("status").textContent = "Lost the connection to the shared counter. Reload the page to reconnect."; });
      ctx.onCleanup(() => { u1(); u2(); });
    })();
    ctx.interval(render, 1000);
    render();
  },
});
