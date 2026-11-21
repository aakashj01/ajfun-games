Arcade.register({
  id: "customer-support-hold",
  title: "Customer Support Hold",
  cat: "rules",
  color: "--t-peach",
  spec: "Press 1<br>Press 2<br>Press 9",
  blurb: "You're stuck in a phone menu. Every option leads somewhere stranger. Find a human.",
  mount(root, ctx) {
    const N = {
      root: { say: "Thank you for calling Consolidated Everything. Your call is important to us. Please listen carefully, as our menu options have changed, and will keep changing. For billing, press 1. For technical support, press 2. For questions about this menu, press 3. To hear these options more soothingly, press 4. To speak to a human, press 5.", keys: { 1: "billing", 2: "tech", 3: "menuq", 4: "soothing", 5: "human" } },
      soothing: { slow: true, say: "Shhh. It's okay. For billing… press 1. For technical support… press 2. For questions about this menu… press 3. To speak to a human… press 5. Or don't. Just rest.", keys: { 1: "billing", 2: "tech", 3: "menuq", 5: "human" } },
      human: { say: "All of our humans are currently being human somewhere else. Estimated wait time: between 3 and 400 minutes. Please enjoy this music.", hold: 14, next: "queue" },
      queue: { say: "Thank you for holding. You are caller number {q} in the queue. When you started, you were number 12. To keep holding, press 1. To return to the main menu, press 9.", keys: { 1: "human2", 9: "root" } },
      human2: { say: "Excellent choice. Please enjoy more music.", hold: 12, next: "queue2" },
      queue2: { say: "Thank you for your patience. Our records show you have been very patient. Unfortunately, patience is not an accepted payment method. Returning to the main menu.", auto: "root" },
      billing: { say: "Billing. To pay your bill, press 1. To dispute a charge, press 2. To return to the main menu, press 9.", keys: { 1: "pay", 2: "dispute", 9: "root" } },
      pay: { say: "Please enter your account number, followed by the pound key.", input: { until: "#", next: "paid" } },
      paid: { say: "Thank you. That account number is correct. Unfortunately, correct account numbers cannot be processed at this time. Returning to the main menu.", auto: "root" },
      dispute: { say: "To dispute a charge, please describe the charge out loud after the tone. … … … I'm sorry, I didn't catch that. To try again, press 1. To accept the charge, press 2.", tone: true, keys: { 1: "dispute", 2: "accepted" } },
      accepted: { say: "Thank you for accepting the charge. A fee of four dollars has been added for processing your dispute. Returning to the main menu.", auto: "root" },
      tech: { say: "Technical support. Have you tried turning it off and on again? If yes, press 1. If no, press 2.", keys: { 1: "properly", 2: "doit" } },
      doit: { say: "Please do that now. We'll wait.", hold: 8, next: "fixed" },
      fixed: { say: "Welcome back. Did that fix the problem? If yes, press 1. If no, press 2.", keys: { 1: "bye", 2: "bye2" } },
      bye: { say: "Wonderful. Thank you for calling Consolidated Everything. Goodbye.", hangup: true },
      bye2: { say: "We're sorry to hear that. Please call back once the problem is fixed. Goodbye.", hangup: true },
      properly: { say: "Did you turn it off and on properly? If yes, press 1. If you're not sure what properly means, press 2.", keys: { 1: "doit", 2: "cant" } },
      cant: { say: "We are not able to explain that over the phone. Returning to the main menu.", auto: "root" },
      menuq: { say: "Questions about this menu. To hear how many options this menu has, press 1. To report a problem with this menu, press 2. To return to the main menu, press 9.", keys: { 1: "count", 2: "report", 9: "root", 7: "secret" } },
      count: { say: "This menu has several options. Thank you for asking. Returning to questions about this menu.", auto: "menuq" },
      report: { say: "To report a problem with this menu, please call our menu support line, which is this line. Returning to the main menu.", auto: "root" },
      secret: { say: "Oh. You pressed 7. There is no option 7. Very few callers find this menu. To reach a human, press the star key three times.", input: { expect: "***", next: "spell", wrong: "nope" } },
      nope: { say: "That was not three stars. This menu will now forget it exists. Returning to the main menu.", auto: "root" },
      spell: { say: "Good. Now, to prove you mean it, spell the word PLEASE on your keypad.", input: { expect: "753273", next: "connecting", wrong: "spellwrong" } },
      spellwrong: { say: "That did not spell please. It spelled something else entirely, and we're choosing not to read it. Returning to the main menu.", auto: "root" },
      connecting: { say: "Thank you. Connecting you to a human. Please hold.", hold: 10, next: "win" },
      win: { win: true },
    };
    const HOLD_LINES = ["Your call is important to us.", "Please stay on the line.", "Did you know? You can also not call us.", "A representative will be with you shortly, in a geological sense.", "Your call may be recorded for comedy purposes."];
    const LETTERS = { 1: "", 2: "ABC", 3: "DEF", 4: "GHI", 5: "JKL", 6: "MNO", 7: "PQRS", 8: "TUV", 9: "WXYZ", 0: "+", "*": "", "#": "" };

    root.innerHTML = `
      <style>
        .oh { display: grid; grid-template-columns: minmax(0, 380px) minmax(0, 1fr); gap: 24px; align-items: start; }
        @media (max-width: 820px) { .oh { grid-template-columns: 1fr; } }
        .oh-phone { background: #1C1D26; border-radius: 34px; padding: 22px 20px 26px; display: grid; gap: 16px; box-shadow: inset 0 0 0 2px #33354A; }
        .oh-lcd { background: #B7C9A0; color: #1F2A17; border-radius: 12px; padding: 14px; min-height: 210px; font-family: var(--font-mono); font-size: 14px; line-height: 1.45; display: grid; grid-template-rows: auto 1fr auto; gap: 8px; box-shadow: inset 0 2px 6px rgba(0,0,0,.25); }
        .oh-lcd .top { display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; }
        .oh-lcd .buf { font-weight: 700; font-size: 16px; min-height: 1.3em; letter-spacing: .12em; }
        .oh-keys { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .oh-key { border: none; border-radius: 50%; aspect-ratio: 1; max-width: 86px; justify-self: center; width: 100%; background: #2D2F3F; color: #F3F3F7; cursor: pointer; display: grid; place-content: center; line-height: 1; transition: background .1s; }
        .oh-key:active, .oh-key.hit { background: #4A4D66; }
        .oh-key b { font-size: 26px; font-weight: 600; font-family: var(--font-body); }
        .oh-key small { font-size: 10px; letter-spacing: .18em; opacity: .7; margin-top: 3px; min-height: 1em; }
        .oh-row { display: flex; gap: 10px; justify-content: center; }
        .oh-hang { background: #E0453A; color: #fff; border: none; border-radius: 999px; padding: 12px 26px; font-weight: 700; cursor: pointer; }
        .oh-call { background: #2FB36B; color: #fff; border: none; border-radius: 999px; padding: 12px 26px; font-weight: 700; cursor: pointer; }
        .oh-side { display: grid; gap: 14px; }
        .oh-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; }
        .oh-stats div { padding: 12px 14px; }
        .oh-stats span { display: block; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); font-weight: 700; }
        .oh-stats b { font-size: 24px; }
        .oh-human { padding: 20px; border-radius: 16px; background: var(--fg); color: var(--bg); display: grid; gap: 12px; }
        .oh-human .big { font-family: var(--font-display); font-size: 30px; font-weight: 800; line-height: 1.1; }
        .oh-note { font-size: 14px; color: var(--muted); border-left: 3px solid var(--line); padding-left: 10px; }
        .oh-label { display: flex; gap: 8px; align-items: center; font-size: 14px; font-weight: 600; }
      </style>
      <div style="margin-bottom:18px"><h1 class="g-title">Customer Support Hold</h1>
        <p class="g-lede">You need to speak to a human. Use the keypad, or type numbers on your keyboard. Nobody has ever made it through. That's probably not true.</p></div>
      <div class="oh">
        <div class="oh-phone">
          <div class="oh-lcd" aria-live="polite"><div class="top"><span id="lcd-state">READY</span><span id="lcd-time">00:00</span></div><div id="lcd-text">Press Call to ring Consolidated Everything.</div><div class="buf" id="lcd-buf"></div></div>
          <div class="oh-keys">${["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map(k => `<button class="oh-key" data-k="${k}" aria-label="${k}"><b>${k}</b><small>${LETTERS[k]}</small></button>`).join("")}</div>
          <div class="oh-row"><button class="oh-call" id="call">Call</button><button class="oh-hang" id="hang">Hang up</button></div>
        </div>
        <div class="oh-side">
          <div class="oh-stats">
            <div class="panel"><span>Time on call</span><b class="mono" id="s-time">0:00</b></div>
            <div class="panel"><span>Buttons pressed</span><b class="mono" id="s-press">0</b></div>
            <div class="panel"><span>Back to main menu</span><b class="mono" id="s-root">0</b></div>
            <div class="panel"><span>Calls dropped</span><b class="mono" id="s-drop">0</b></div>
          </div>
          <label class="oh-label"><input type="checkbox" id="voice"> Read the menu aloud (uses your browser's voice)</label>
          <div id="hint"></div>
          <div id="human"></div>
          <div class="muted" style="font-size:14px">Fastest time to a human in this browser: <b class="mono" id="best"></b></div>
        </div>
      </div>`;

    const $ = id => root.querySelector("#" + id);
    let endAt = 0, node = null, live = false, callStart = 0, totalStart = 0, presses = 0, roots = 0, drops = 0, buf = "", typing = null, holdEnd = 0, holdLineTimer = null, queueNo = 12, musicTimer = null, hinted = false;
    const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
    const showBest = () => { const b = Arcade.store.get("hold:best", null); $("best").textContent = b == null ? "never" : fmt(b); };
    showBest();

    function speak(text, slow) {
      if (!$("voice").checked || !window.speechSynthesis) return;
      try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text.replace(/…/g, "...")); u.rate = slow ? 0.7 : 1.05; speechSynthesis.speak(u); } catch {}
    }
    function stopSpeech() { try { window.speechSynthesis && speechSynthesis.cancel(); } catch {} }
    ctx.onCleanup(() => { stopSpeech(); stopMusic(); });

    function typeOut(text, slow, done) {
      ctx.clear(typing);
      const el = $("lcd-text"); let i = 0; el.textContent = "";
      typing = ctx.interval(() => {
        i += slow ? 1 : 2; el.textContent = text.slice(0, i);
        if (i >= text.length) { ctx.clear(typing); done && done(); }
      }, slow ? 70 : 32);
    }

    function go(id) {
      if (!live) return;
      node = N[id]; buf = ""; $("lcd-buf").textContent = "";
      if (id === "root") { roots++; $("s-root").textContent = roots; }
      if (node.win) return win();
      const text = node.say.replace("{q}", queueNo);
      if (id === "queue") queueNo += 7 + Math.floor(Math.random() * 30);
      $("lcd-state").textContent = node.hold ? "ON HOLD" : "MENU";
      speak(text, node.slow);
      if (node.tone) Arcade.beep(1000, .4, "sine", .1, 2.5);
      typeOut(text, node.slow, () => {
        if (node !== N[id]) return;
        if (node.auto) ctx.timeout(() => { if (node === N[id]) go(node.auto); }, 1500);
        if (node.hangup) ctx.timeout(() => { if (node === N[id]) drop("They hung up on you. Politely."); }, 1500);
        if (node.hold) startHold(node.hold, node.next);
      });
      maybeHint();
    }

    function startHold(secs, next) {
      holdEnd = performance.now() + secs * 1000; startMusic();
      ctx.clear(holdLineTimer);
      holdLineTimer = ctx.interval(() => { if (!live || !node.hold) return; $("lcd-text").textContent = "♪ " + HOLD_LINES[Math.floor(Math.random() * HOLD_LINES.length)] + " ♪"; }, 4000);
      const id = Object.keys(N).find(k => N[k] === node);
      ctx.timeout(() => { if (live && node === N[id]) { stopMusic(); ctx.clear(holdLineTimer); go(next); } }, secs * 1000);
    }
    function startMusic() {
      stopMusic();
      const tune = [523, 659, 784, 659, 587, 698, 880, 698, 523, 659, 784, 1047, 988, 784, 659, 587];
      let i = 0;
      musicTimer = ctx.interval(() => { Arcade.beep(tune[i % tune.length], 0.32, "triangle", 0.05); if (i % 4 === 0) Arcade.beep(tune[i % tune.length] / 2, 0.6, "sine", 0.04); i++; }, 340);
    }
    function stopMusic() { ctx.clear(musicTimer); musicTimer = null; }

    function press(k) {
      const b = root.querySelector(`.oh-key[data-k="${CSS.escape(k)}"]`);
      if (b) { b.classList.add("hit"); ctx.timeout(() => b.classList.remove("hit"), 120); }
      const f = { 1: 697, 2: 697, 3: 697, 4: 770, 5: 770, 6: 770, 7: 852, 8: 852, 9: 852, "*": 941, 0: 941, "#": 941 }[k];
      Arcade.beep(f, .12, "sine", .08); Arcade.beep(f * 1.74, .12, "sine", .06);
      if (!live) return;
      presses++; $("s-press").textContent = presses;
      if (node.hold && !node.keys) { $("lcd-text").textContent = "Please continue to hold. Pressing buttons does not make the music go faster."; return; }
      if (node.auto || node.hangup || node.win) return;
      if (k === "0") {
        const back = Object.keys(N).find(x => N[x] === node);
        ctx.clear(typing); stopSpeech();
        $("lcd-text").textContent = "Pressing zero does not connect you to an operator. It never has. It never will.";
        ctx.timeout(() => { if (live && N[back] === node) go(back); }, 2600);
        return;
      }
      if (node.input) {
        buf += k; $("lcd-buf").textContent = buf;
        const inp = node.input;
        if (inp.until && k === inp.until) return go(inp.next);
        if (inp.expect && buf.length >= inp.expect.length) return go(buf === inp.expect ? inp.next : inp.wrong);
        return;
      }
      const nxt = node.keys && node.keys[k];
      if (nxt) { stopSpeech(); go(nxt); }
      else { ctx.clear(typing); $("lcd-text").textContent = `${k} is not a valid option. Please try again, but differently.`; const cur = node; ctx.timeout(() => { if (live && node === cur) go(Object.keys(N).find(x => N[x] === cur)); }, 2000); }
    }

    function call() {
      if (live) return;
      live = true; if (endAt) { endAt = 0; totalStart = 0; presses = 0; roots = 0; drops = 0; hinted = false; }
      if (!totalStart) totalStart = performance.now(); callStart = performance.now();
      $("human").innerHTML = ""; queueNo = 12;
      Arcade.beep(440, .5, "sine", .06); Arcade.beep(480, .5, "sine", .06);
      $("lcd-text").textContent = "Ringing…"; $("lcd-state").textContent = "CALLING";
      ctx.timeout(() => { roots = roots - 1; go("root"); }, 1400);
    }
    function drop(why) {
      if (!live) return;
      live = false; stopMusic(); stopSpeech(); ctx.clear(typing); ctx.clear(holdLineTimer);
      drops++; $("s-drop").textContent = drops;
      $("lcd-state").textContent = "CALL ENDED"; $("lcd-text").textContent = why + " Press Call to try again."; $("lcd-buf").textContent = "";
      Arcade.beep(480, .25, "square", .05); Arcade.beep(380, .3, "square", .05, .3);
    }
    function maybeHint() {
      if (hinted || !totalStart) return;
      if ((performance.now() - totalStart) / 1000 > 150 || roots >= 6) {
        hinted = true;
        $("hint").innerHTML = `<div class="oh-note">Someone scratched a note into this phone: "In the questions menu, try a number they never mention."</div>`;
      }
    }

    function win() {
      stopMusic(); stopSpeech();
      $("lcd-state").textContent = "CONNECTED"; $("lcd-text").textContent = "A real human voice. You'd forgotten what one sounds like.";
      const secs = (performance.now() - totalStart) / 1000;
      $("human").innerHTML = `<div class="oh-human"><div class="big">"Hi, this is Marguerite. How can I help you today?"</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px"><button class="btn" id="h-a">"I just wanted to talk to a human."</button><button class="btn" id="h-b">"My internet is down."</button></div></div>`;
      $("h-a").onclick = () => {
        live = false; endAt = performance.now();
        const prev = Arcade.store.get("hold:best", null); if (prev == null || secs < prev) Arcade.store.set("hold:best", secs); showBest();
        $("human").innerHTML = `<div class="oh-human"><div class="big">"…Oh. That's actually really nice. Nobody ever says that."</div>
          <div>You reached a human in <b class="mono">${fmt(secs)}</b>, with ${presses} button presses, ${roots} trips back to the main menu and ${drops} dropped calls.</div></div>`;
        $("lcd-state").textContent = "CALL ENDED"; $("lcd-text").textContent = "Marguerite says have a nice day. She means it.";
      };
      $("h-b").onclick = () => { $("human").innerHTML = ""; node = N.root; drop("\"Have you tried turning it off and—\" Click. The line went dead."); };
    }

    root.querySelectorAll(".oh-key").forEach(b => ctx.on(b, "click", () => press(b.dataset.k)));
    ctx.on($("call"), "click", call);
    ctx.on($("hang"), "click", () => drop("You hung up."));
    ctx.on(window, "keydown", e => {
      if (e.target.closest && e.target.closest("input,textarea")) return;
      if (/^[0-9*#]$/.test(e.key)) { e.preventDefault(); press(e.key); }
      if (e.key === "Enter" && !live) call();
    });
    ctx.interval(() => {
      if (live) $("lcd-time").textContent = fmt((performance.now() - callStart) / 1000);
      if (totalStart) $("s-time").textContent = fmt(((endAt || performance.now()) - totalStart) / 1000);
    }, 250);
  },
});
