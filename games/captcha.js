Arcade.register({
  id: "captcha-from-hell",
  title: "The Captcha From Hell",
  cat: "rules",
  color: "--t-mint",
  spec: "☐ I am<br>not a<br>robot",
  blurb: "Prove you're human. The checks start with traffic lights and end with philosophy.",
  mount(root, ctx) {
    const C = [
      { type: "grid", prompt: "Select all squares containing a <b>traffic light</b>.",
        tiles: ["traffic light", "a traffic light's cousin", "the concept of red", "stop sign", "traffic light (off)", "green", "a pole", "crosswalk", "amber"],
        judge: s => s.size === 0 ? [false, "You selected nothing. Robots love doing nothing."] : [true, "Close enough. That was the warm-up."] },
      { type: "grid", prompt: "Select all squares containing <b>regret</b>.",
        tiles: ["replied all", "sent at 2:14 AM", "a tattoo of a name", "a salad", "bangs", "a puppy", "\"per my last email\"", "a sunset", "free trial (expired)"],
        judge: s => {
          if (s.has(5)) return [false, "You regret a puppy? Only a robot regrets a puppy."];
          if (s.has(7)) return [false, "Nobody regrets a sunset. Try again, machine."];
          if (s.size < 3) return [false, "You have more regrets than that. Everyone does."];
          return [true, s.has(3) ? "The salad. Interesting choice. Accepted." : "Accepted. That was painful to watch."];
        } },
      { type: "text", prompt: "Type the word below.", word: "humanish" },
      { type: "wait", prompt: "A robot would click Verify right away. <b>Prove you're human by waiting.</b>", secs: 8 },
      { type: "grid", prompt: "Select all squares containing <b>yourself</b>.",
        tiles: ["a stranger", "a mirror", "a crowd", "a bus", "a person reading this sentence", "a cloud", "an empty room", "your reflection in a dark screen", "a bird"],
        judge: s => {
          const ok = new Set([1, 4, 7]);
          if (s.size === 0) return [false, "You aren't in any of them? Suspicious."];
          if ([...s].some(i => !ok.has(i))) return [false, "That isn't you. Humans usually know what they look like."];
          return [true, "Yes, hello. Nice to see you."];
        } },
      { type: "slider", prompt: "Slide all the way to prove you have <b>felt love</b>." },
      { type: "runaway", prompt: "Check the box. That's all. Just check the box." },
      { type: "rate", prompt: "<b>Rate this sunset.</b> A human will know the right answer." },
      { type: "grid", prompt: "Select all squares containing <b>the passage of time</b>.",
        tiles: ["a clock", "a candle", "an old dog", "a calendar", "a sandwich", "your hands", "a mountain", "this captcha", "nothing"],
        judge: s => s.size === 9 ? [true, "Correct. Every square contains the passage of time. Some of yours went into this one."] : [false, `Missed ${9 - s.size}. Time is in everything, even sandwiches.`] },
      { type: "essay", prompt: "Final check. In your own words, <b>what does it feel like to be human?</b>" },
    ];

    root.innerHTML = `
      <style>
        .cp { display: grid; gap: 22px; grid-template-columns: minmax(0, 420px) minmax(0, 1fr); align-items: start; }
        @media (max-width: 820px) { .cp { grid-template-columns: 1fr; } }
        .cp-w { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,.08); }
        .cp-h { background: #2F6BEA; color: #fff; padding: 18px 18px 20px; font-size: 18px; line-height: 1.35; }
        .cp-h small { display: block; font-size: 12px; opacity: .8; margin-bottom: 4px; letter-spacing: .06em; text-transform: uppercase; font-weight: 700; }
        .cp-b { padding: 10px; min-height: 260px; display: grid; }
        .cp-f { display: flex; align-items: center; gap: 12px; justify-content: space-between; padding: 10px 12px; border-top: 1px solid var(--line); }
        .cp-msg { font-size: 14px; font-weight: 600; min-height: 1.3em; }
        .cp-msg.bad { color: var(--bad); } .cp-msg.good { color: var(--good); }
        .cp-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
        .cp-tile { position: relative; aspect-ratio: 1; border: none; cursor: pointer; padding: 8px; color: #fff; font-weight: 700; font-size: 14px; line-height: 1.2;
          display: grid; place-items: end start; text-align: left; text-shadow: 0 1px 2px rgba(0,0,0,.5); transition: transform .12s; }
        .cp-tile.sel { transform: scale(.86); }
        .cp-tile.sel::after { content: "✓"; position: absolute; top: 6px; left: 6px; width: 24px; height: 24px; border-radius: 50%; background: #2F6BEA; display: grid; place-items: center; font-size: 14px; text-shadow: none; }
        .cp-side { display: grid; gap: 14px; }
        .cp-prog { display: flex; gap: 6px; flex-wrap: wrap; }
        .cp-prog i { width: 26px; height: 8px; border-radius: 4px; background: var(--surface-2); }
        .cp-prog i.ok { background: var(--good); } .cp-prog i.retry { background: var(--t-yolk); } .cp-prog i.now { background: var(--fg); }
        .cp-track { position: relative; height: 56px; border-radius: 28px; background: var(--surface-2); margin: auto 8px; align-self: center; user-select: none; touch-action: none; }
        .cp-fill { position: absolute; inset: 0 auto 0 0; border-radius: 28px; background: var(--t-pink); }
        .cp-knob { position: absolute; top: 4px; width: 48px; height: 48px; border-radius: 50%; background: var(--fg); cursor: grab; display: grid; place-items: center; color: var(--bg); font-size: 20px; }
        .cp-lbl { text-align: center; font-weight: 700; margin-top: 14px; }
        .cp-run { position: relative; min-height: 240px; }
        .cp-box { position: absolute; display: flex; align-items: center; gap: 10px; padding: 12px 14px; border: 1px solid var(--line); border-radius: 6px; background: var(--bg);
          transition: left .18s ease-out, top .18s ease-out; font-weight: 600; white-space: nowrap; }
        .cp-box span { width: 26px; height: 26px; border: 2px solid var(--muted); border-radius: 4px; display: grid; place-items: center; cursor: pointer; }
        .cp-sunset { height: 170px; border-radius: 6px; background: linear-gradient(#2B1F5C, #C2457A 45%, #FF9A4D 70%, #FFD58A 78%, #1D2440 78.5%, #0D1226); position: relative; }
        .cp-sunset::after { content: ""; position: absolute; left: 50%; top: 58%; width: 70px; height: 70px; margin-left: -35px; border-radius: 50%; background: #FFE3A3; clip-path: inset(0 0 45% 0); }
        .cp-stars { display: flex; justify-content: center; gap: 6px; margin-top: 14px; }
        .cp-stars button { font-size: 32px; background: none; border: none; cursor: pointer; color: var(--muted); }
        .cp-stars button:hover, .cp-stars button.on { color: #F2B01E; }
        .cp-end { padding: 22px; border-radius: 14px; background: var(--fg); color: var(--bg); display: grid; gap: 8px; }
        .cp-end .big { font-family: var(--font-display); font-weight: 800; font-size: 54px; line-height: 1; }
        .cp textarea, .cp input[type=text] { width: 100%; border: 1.5px solid var(--line); border-radius: 6px; padding: 10px; background: var(--bg); }
      </style>
      <div style="margin-bottom:18px"><h1 class="g-title">The Captcha From Hell</h1>
        <p class="g-lede">Ten checks stand between you and being officially human. You get a better score for passing each one first time.</p></div>
      <div class="cp">
        <div class="cp-w" id="w">
          <div class="cp-h" id="hd"></div>
          <div class="cp-b" id="bd"></div>
          <div class="cp-f"><div class="cp-msg" id="msg"></div><button class="btn primary" id="verify">Verify</button></div>
        </div>
        <div class="cp-side">
          <div class="cp-prog" id="prog"></div>
          <div class="muted" id="side-note">Green means passed on the first try. Yellow means it took a few attempts.</div>
          <div id="end"></div>
        </div>
      </div>`;

    const $ = id => root.querySelector("#" + id);
    let idx = 0, tries = 0, results = [], state = {}, localCtx = null;
    const hues = [8, 32, 140, 200, 260, 320, 175, 50, 290];

    function prog() {
      $("prog").innerHTML = C.map((_, i) => `<i class="${i < results.length ? (results[i] === 1 ? "ok" : "retry") : i === idx ? "now" : ""}"></i>`).join("");
    }
    function msg(t, cls = "") { const m = $("msg"); m.textContent = t; m.className = "cp-msg " + cls; }

    function pass(text) {
      results.push(tries === 0 ? 1 : 0);
      msg(text, "good"); Arcade.beep(880, .12, "triangle"); $("verify").disabled = true;
      ctx.timeout(() => { idx++; tries = 0; if (idx < C.length) load(); else finish(); }, 1400);
    }
    function fail(text) { tries++; msg(text, "bad"); Arcade.beep(180, .2, "square", .07); }

    function load() {
      const c = C[idx]; state = {}; prog(); msg(""); $("verify").disabled = false; $("verify").hidden = false;
      $("hd").innerHTML = `<small>Check ${idx + 1} of ${C.length}</small>${c.prompt}`;
      const bd = $("bd");
      if (localCtx) localCtx.abort(); localCtx = new AbortController();
      const sig = { signal: localCtx.signal };
      if (c.type === "grid") {
        state.sel = new Set();
        bd.innerHTML = `<div class="cp-grid">${c.tiles.map((t, i) => {
          const h = hues[(i + idx * 2) % hues.length];
          return `<button class="cp-tile" data-i="${i}" style="background:linear-gradient(135deg,hsl(${h} 55% 48%),hsl(${(h + 40) % 360} 60% 32%))">${Arcade.esc(t)}</button>`;
        }).join("")}</div>`;
        bd.querySelectorAll(".cp-tile").forEach(b => b.addEventListener("click", () => {
          const i = +b.dataset.i; state.sel.has(i) ? state.sel.delete(i) : state.sel.add(i); b.classList.toggle("sel");
        }, sig));
      } else if (c.type === "text") {
        bd.innerHTML = `<div style="display:grid;gap:10px;align-content:center"><canvas id="word" style="width:100%;height:110px;border-radius:6px;background:#E8E4DA"></canvas><input type="text" id="cp-in" placeholder="Type the word" autocomplete="off"><button class="btn" id="newword" style="justify-self:start">New word (same word)</button></div>`;
        const draw = () => drawWord(bd.querySelector("#word"), c.word);
        draw(); bd.querySelector("#newword").addEventListener("click", () => { draw(); msg("Same word, new disguise."); }, sig);
        bd.querySelector("#cp-in").addEventListener("keydown", e => { if (e.key === "Enter") verify(); }, sig);
      } else if (c.type === "wait") {
        state.t0 = performance.now();
        bd.innerHTML = `<div style="display:grid;place-items:center;text-align:center;gap:8px"><div style="font-size:64px" aria-hidden="true">⏳</div><div class="muted" id="waitmsg">Waiting is a uniquely human skill.</div></div>`;
        const tick = () => {
          if (C[idx] !== c || results.length > idx) return;
          if (performance.now() - state.t0 >= c.secs * 1000) { pass("Patience detected. Robots can't stand this part."); return; }
          ctx.timeout(tick, 200);
        };
        tick();
      } else if (c.type === "slider") {
        bd.innerHTML = `<div style="align-self:center"><div class="cp-track" id="trk"><div class="cp-fill" id="fill"></div><div class="cp-knob" id="knob">♥</div></div><div class="cp-lbl" id="lbl">Mild fondness</div></div>`;
        $("verify").hidden = true;
        const trk = bd.querySelector("#trk"), knob = bd.querySelector("#knob"), fill = bd.querySelector("#fill"), lbl = bd.querySelector("#lbl");
        const LBL = ["Mild fondness", "A good sandwich", "A crush", "Your first pet", "Your grandmother's soup", "Love"];
        let raw = 0, drag = false;
        const set = v => {
          const d = Math.pow(v, 2.4); const max = trk.clientWidth - 56;
          knob.style.left = (4 + d * max) + "px"; fill.style.width = (28 + d * max) + "px";
          lbl.textContent = LBL[Math.min(LBL.length - 1, Math.floor(d * LBL.length))];
          return d;
        };
        set(0);
        knob.addEventListener("pointerdown", e => { drag = true; knob.setPointerCapture(e.pointerId); }, sig);
        knob.addEventListener("pointermove", e => {
          if (!drag) return; const r = trk.getBoundingClientRect();
          raw = Math.max(0, Math.min(1, (e.clientX - r.left - 28) / (r.width - 56)));
          if (set(raw) >= 0.995) { drag = false; pass("That's love. Or a very strong mouse hand."); }
        }, sig);
        knob.addEventListener("pointerup", () => {
          if (!drag) return; drag = false;
          if (results.length > idx) return;
          tries++; msg("Not quite love. It slipped away, as love does.", "bad");
          const spring = () => { raw *= 0.82; set(raw); if (raw > 0.002 && !drag) requestAnimationFrame(spring); };
          spring();
        }, sig);
      } else if (c.type === "runaway") {
        state.dodges = 0;
        bd.innerHTML = `<div class="cp-run" id="run"><div class="cp-box" id="box" style="left:20px;top:90px"><span id="cb"></span>I am not a robot</div></div>`;
        $("verify").hidden = true;
        const run = bd.querySelector("#run"), box = bd.querySelector("#box"), cb = bd.querySelector("#cb");
        cb.addEventListener("pointerenter", () => {
          if (state.dodges >= 6) return;
          state.dodges++;
          const maxX = run.clientWidth - box.offsetWidth, maxY = run.clientHeight - box.offsetHeight;
          box.style.left = Math.random() * Math.max(0, maxX) + "px"; box.style.top = Math.random() * Math.max(0, maxY) + "px";
          if (state.dodges === 6) msg("The checkbox is tired. Go on.");
        }, sig);
        cb.addEventListener("click", () => {
          if (state.dodges < 6) { tries++; return; }
          cb.textContent = "✓"; pass("Got it. The checkbox respects you now.");
        }, sig);
      } else if (c.type === "rate") {
        bd.innerHTML = `<div><div class="cp-sunset" role="img" aria-label="A sunset"></div><div class="cp-stars">${[1, 2, 3, 4, 5].map(n => `<button data-n="${n}" aria-label="${n} stars">★</button>`).join("")}</div></div>`;
        $("verify").hidden = true;
        bd.querySelectorAll(".cp-stars button").forEach(b => b.addEventListener("click", () => {
          const n = +b.dataset.n;
          bd.querySelectorAll(".cp-stars button").forEach(x => x.classList.toggle("on", +x.dataset.n <= n));
          if (results.length > idx) return;
          if (tries === 0) fail(n === 5 ? "Robots always give five stars. Suspicious." : `${n} stars? A human would never rate a sunset that low.`);
          else pass("Inconsistent. Very human.");
        }, sig));
      } else if (c.type === "essay") {
        bd.innerHTML = `<div style="display:grid;gap:8px;align-content:center"><textarea id="essay" rows="6" placeholder="Take your time."></textarea><div class="muted" style="font-size:13px">At least four words. We will read them.</div></div>`;
      }
    }

    function verify() {
      const c = C[idx];
      if (results.length > idx) return;
      if (c.type === "grid") { const [ok, t] = c.judge(state.sel); ok ? pass(t) : fail(t); }
      else if (c.type === "text") {
        const v = ($("cp-in").value || "").trim().toLowerCase();
        if (!v) return fail("You typed nothing. Bold.");
        lev(v, c.word) <= 2 ? pass(v === c.word ? "Perfect. Suspiciously perfect, but fine." : "Close enough. Humans make typos.") : (fail(`"${v}"? Not even close. Try squinting.`), drawWord($("word"), c.word));
      }
      else if (c.type === "wait") { state.t0 = performance.now(); fail("You clicked. A robot would click. The timer starts over."); }
      else if (c.type === "essay") {
        const words = ($("essay").value || "").trim().split(/\s+/).filter(Boolean);
        if (words.length < 4) return fail(words.length ? "That's barely a feeling. Four words, please." : "Silence is very relatable, but please type something.");
        pass("Thank you. Our robot found this very moving.");
      }
    }
    ctx.on($("verify"), "click", verify);
    ctx.onCleanup(() => localCtx && localCtx.abort());

    function finish() {
      prog();
      const firsts = results.filter(x => x === 1).length;
      const pct = Math.round(40 + firsts * 6);
      const v = pct >= 96 ? "Certified human. Possibly too human." : pct >= 80 ? "Mostly human. Some toaster energy." : pct >= 60 ? "Human-ish. You'd pass at a party." : "We have concerns. Please drink some water, if you do that.";
      Arcade.store.set("captcha:last", pct);
      $("hd").innerHTML = `<small>Complete</small>You are officially human. Probably.`;
      $("bd").innerHTML = `<div style="display:grid;place-items:center;font-size:72px" aria-hidden="true">🫠</div>`;
      $("verify").hidden = true; msg("");
      $("end").innerHTML = `<div class="cp-end"><div class="big">${pct}% human</div><div style="font-weight:700;font-size:18px">${v}</div>
        <div>${firsts} of ${C.length} passed first time.</div><div><button class="btn" id="again">Take it again</button></div></div>`;
      $("again").onclick = () => { idx = 0; tries = 0; results = []; $("end").innerHTML = ""; load(); };
    }

    function drawWord(cv, word) {
      const w = cv.clientWidth || 380, h = 110; const g = Arcade.canvasFit(cv, w, h);
      g.fillStyle = "#E8E4DA"; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 9; i++) { g.strokeStyle = `hsla(${Math.random() * 360},40%,40%,.5)`; g.lineWidth = 1 + Math.random() * 2; g.beginPath(); g.moveTo(0, Math.random() * h); g.bezierCurveTo(w / 3, Math.random() * h, 2 * w / 3, Math.random() * h, w, Math.random() * h); g.stroke(); }
      const step = (w - 40) / word.length;
      [...word].forEach((ch, i) => {
        g.save(); g.translate(26 + i * step + Math.random() * 6, h / 2 + 14 + (Math.random() - .5) * 26);
        g.rotate((Math.random() - .5) * 0.9); g.scale(0.8 + Math.random() * 0.6, 0.8 + Math.random() * 0.6);
        g.font = `${["italic ", "", "bold "][i % 3]}${38 + Math.random() * 16}px ${["Georgia", "Courier New", "Impact", "Arial"][Math.floor(Math.random() * 4)]}`;
        g.fillStyle = `hsl(${Math.random() * 360},45%,${22 + Math.random() * 18}%)`; g.fillText(ch, 0, 0); g.restore();
      });
      for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * .35})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    }
    function lev(a, b) {
      const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
      for (let j = 1; j <= b.length; j++) d[0][j] = j;
      for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      return d[a.length][b.length];
    }
    load();
  },
});
