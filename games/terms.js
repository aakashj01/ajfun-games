Arcade.register({
  id: "terms-and-conditions",
  title: "Terms & Conditions",
  cat: "rules",
  color: "--t-lilac",
  spec: "§ 4.2(b)",
  blurb: "You have to actually read the license agreement. The fine print is out to get you. The escape clauses are hidden in it too.",
  mount(root, ctx) {
    const ITEMS = {
      leftShoe: "Left shoe", rightShoe: "Right shoe", lunch: "Lunch", weekend: "Weekend", mug: "Favorite mug",
      name: "Your name", humor: "Sense of humor", wifi: "Wi-Fi password", complain: "Right to complain", plant: "Houseplant",
    };
    const have = Object.fromEntries(Object.keys(ITEMS).map(k => [k, true]));
    const voided = {}; // clause escape flags
    let goose = false, anchored = false, accepted = false, scrolledEnd = false, honkCount = 0, typed = "";
    const t0 = performance.now();

    root.innerHTML = `
      <style>
        .tc { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 20px; align-items: start; }
        @media (max-width: 860px) { .tc { grid-template-columns: 1fr; } }
        .tc-doc { height: min(64vh, 640px); overflow-y: auto; padding: 28px 30px; background: var(--surface); border: 1px solid var(--line); border-radius: 14px;
          font-family: Georgia, "Times New Roman", serif; font-size: 15.5px; line-height: 1.65; }
        .tc-doc h2 { font-family: var(--font-body); font-size: 13px; letter-spacing: .14em; text-transform: uppercase; margin: 26px 0 8px; }
        .tc-doc h1 { font-family: var(--font-display); font-size: 26px; margin: 0 0 4px; }
        .tc-doc p { margin: 0 0 12px; max-width: 70ch; }
        .tc-doc .fine { font-size: 12px; color: var(--muted); }
        .tc-doc .x { cursor: text; }
        .tc-doc .x:hover { background: color-mix(in srgb, var(--accent) 10%, transparent); }
        .tc-doc .dot { cursor: pointer; padding: 0 1px; }
        .tc-doc .dot:hover { color: var(--accent); }
        .tc-sign { margin-top: 28px; padding-top: 18px; border-top: 2px solid var(--fg); font-family: var(--font-body); display: grid; gap: 12px; }
        .tc-sign label { display: flex; gap: 10px; align-items: center; font-weight: 600; }
        .tc-sign input[type=text] { border: none; border-bottom: 1.5px solid var(--fg); background: transparent; padding: 4px 2px; width: min(300px, 100%); }
        .tc-acc { position: relative; height: 64px; }
        .tc-acc .btn { position: absolute; left: 0; top: 8px; transition: left .25s ease, top .25s ease; }
        .tc-side { padding: 18px; display: grid; gap: 10px; position: sticky; top: 76px; }
        .tc-side h3 { margin: 0; font-family: var(--font-display); font-size: 20px; }
        .tc-item { display: flex; justify-content: space-between; gap: 10px; font-weight: 600; font-size: 15px; transition: color .3s; }
        .tc-item.lost { color: var(--bad); text-decoration: line-through; }
        .tc-item.gain { color: var(--good); }
        .tc-item small { font-weight: 500; color: var(--muted); text-decoration: none; }
        .tc-end { padding: 24px; border-radius: 16px; background: var(--fg); color: var(--bg); display: grid; gap: 10px; }
        .tc-end .big { font-family: var(--font-display); font-size: clamp(32px, 6vw, 54px); font-weight: 800; line-height: 1; }
      </style>
      <div style="margin-bottom:18px"><h1 class="g-title">Terms &amp; Conditions</h1>
        <p class="g-lede">Read and accept the agreement. Every clause is legally binding inside this game, so read it all. You'll want to keep your stuff.</p></div>
      <div id="play" class="tc">
        <article class="tc-doc" id="doc" tabindex="0" aria-label="License agreement">${DOC()}</article>
        <aside class="panel tc-side">
          <h3>Your possessions</h3>
          <div id="inv" style="display:grid;gap:6px"></div>
          <div class="muted" style="font-size:13px">Things you lose are listed here as they happen.</div>
        </aside>
      </div>
      <div id="end"></div>`;

    function DOC() {
      return `
      <h1>End User License Agreement</h1>
      <p class="fine">Version 41.7. Supersedes versions 1 through 41.6, and any you may have imagined.</p>
      <h2>1. Definitions</h2>
      <p>In this Agreement, "Licensor" means us. "Licensee" means you, the person currently reading, skimming, or pretending to read. "Software" means this agreement, which is also the product. "Possessions" means the items listed to the right of this document, which you currently own, for now.</p>
      <p>"Reading" means the movement of eyes across text in a manner that would satisfy a reasonable librarian. Scrolling quickly is not reading. We can tell.</p>
      <h2>2. Acceptance</h2>
      <p>By opening this Agreement, Licensee confirms they are at least 13 years of age, or 13 years of age in dog years, whichever is more convenient for the Licensor.</p>
      <p>Licensee acknowledges that the Licensor may change these terms at any time, including while Licensee is reading this sentence. This sentence has changed twice.</p>
      <h2>3. Footwear</h2>
      <p id="trap-scroll"><b>3.1</b> By scrolling past this line, the Licensee surrenders their left shoe to the Licensor, who has a collection.</p>
      <p><b>3.2</b> Double-clicking anywhere in this Agreement constitutes a legally binding high five, payable in right shoes.</p>
      <p><b>3.3</b> Clause 3.1 shall not apply to any Licensee who clicks the word <span class="x" data-esc="barefoot">barefoot</span> in this sentence, as such a Licensee was clearly not wearing shoes to begin with.</p>
      <h2>4. Wildlife</h2>
      <p><b>4.1</b> Any Licensee who places their cursor over the word <span class="x" data-trap="goose">goose</span> agrees to adopt one (1) goose. The goose is hungry. The goose will eat the Licensee's lunch. This is not negotiable; geese do not negotiate.</p>
      <p><b>4.2</b> The goose may be returned by clicking the word <span class="x" data-esc="honk">honk</span> three times. The lunch will not be returned.</p>
      <h2>5. Leisure</h2>
      <p><b>5.1</b> Highlighting, selecting, or otherwise marking any text in this Agreement forfeits the Licensee's next weekend, which will be spent at a mandatory team-building retreat.</p>
      <p><b>5.2</b> Clause 5.1 is suspended for any Licensee who types the word "saturday" on their keyboard at any time, as a gesture of good faith.</p>
      <h2>6. Time</h2>
      <p><b>6.1</b> This Agreement must be accepted within two (2) minutes of opening it. Failure to do so transfers ownership of the Licensee's favorite mug to the Licensor, who will use it for soup.</p>
      <p><b>6.2</b> The time limit in clause 6.1 is paused for any Licensee who clicks this hourglass: <span class="x" data-esc="hourglass" aria-label="hourglass">⌛</span>. It will not be unpaused. We forget things.</p>
      <h2>7. Identity</h2>
      <p><b>7.1</b> Upon acceptance, the Licensee's name is changed to "Customer 4471" unless the Licensee writes their own name in the margin provided at the end of this Agreement.</p>
      <p><b>7.2</b> Customer 4471 is a perfectly nice name. Many people have had it.</p>
      <h2>8. Checkboxes</h2>
      <p><b>8.1</b> Checking the box labelled "I agree" shall be treated as a joke, and the Licensee's sense of humor will be confiscated as evidence.</p>
      <p><b>8.2</b> To agree to this Agreement, the Licensee must check the box labelled "I do not agree". The Licensor regrets nothing.</p>
      <h2>9. Networking</h2>
      <p><b>9.1</b> Copying any portion of this Agreement to the clipboard transfers the Licensee's Wi-Fi password to the Licensor. This clause has no escape. We checked.</p>
      <h2>10. Complaints</h2>
      <p id="trap-read"><b>10.1</b> By reading this sentence, the Licensee waives their right to complain.</p>
      <p><b>10.2</b> The waiver in 10.1 is void if the Licensee complains formally by clicking <span class="x" data-esc="complain">here</span>.</p>
      <h2>11. Horticulture</h2>
      <p><b>11.1</b> The Licensor will water the Licensee's houseplant daily, using coffee. The Licensor does not know much about plants.</p>
      <p><b>11.2</b> To decline the watering service, the Licensee must click the word decline. Not this one: <span class="x" data-esc="decline-wrong">decline</span>. The next one: <span class="x" data-esc="decline">decline</span>.</p>
      <h2>12. The Accept Button</h2>
      <p><b>12.1</b> The Accept button is shy and will move away from the Licensee's cursor.</p>
      <p><b>12.2</b> The Accept button is legally required to remain still once the Licensee has clicked the full stop at the end of this sentence<span class="dot" data-esc="anchor">.</span></p>
      <h2>13. Miscellaneous</h2>
      <p>If any provision of this Agreement is found to be unenforceable, it will be replaced with a provision about a different goose. This Agreement is governed by the laws of a country that is mostly fog. All disputes will be settled by a coin toss. The coin belongs to the Licensor.</p>
      <p>Licensee confirms they have read every clause, including this one, and the one before it, which they skipped.</p>
      <div class="tc-sign">
        <label>Name, in the margin: <input type="text" id="tc-name" placeholder="Your name" autocomplete="off"></label>
        <label><input type="checkbox" id="tc-yes"> I agree</label>
        <label><input type="checkbox" id="tc-no"> I do not agree</label>
        <div class="tc-acc" id="acc-wrap"><button class="btn primary" id="accept" disabled>Accept</button></div>
        <div class="fine" id="acc-hint">Scroll to the bottom to enable Accept.</div>
      </div>`;
    }

    const $ = id => root.querySelector("#" + id);
    const doc = $("doc"), inv = $("inv"), accept = $("accept");

    function renderInv() {
      inv.innerHTML = Object.entries(ITEMS).map(([k, label]) =>
        `<div class="tc-item ${have[k] ? "" : "lost"}"><span>${label}</span><small>${have[k] ? "kept" : "forfeited"}</small></div>`).join("")
        + (goose ? `<div class="tc-item gain"><span>One goose</span><small>adopted</small></div>` : "");
    }
    function lose(k, why) {
      if (accepted || !have[k]) return;
      have[k] = false; renderInv(); Arcade.toast(why); Arcade.beep(220, .25, "square", .07);
    }
    function regain(k, why) {
      if (accepted || have[k]) return;
      have[k] = true; renderInv(); Arcade.toast(why); Arcade.beep(660, .15, "triangle");
    }
    renderInv();

    // 3.1 scroll trap; also end-of-doc detection
    ctx.on(doc, "scroll", () => {
      const trap = $("trap-scroll");
      if (!voided.barefoot && trap.offsetTop + trap.offsetHeight < doc.scrollTop + 4) lose("leftShoe", "Clause 3.1: left shoe surrendered.");
      if (!scrolledEnd && doc.scrollTop + doc.clientHeight >= doc.scrollHeight - 30) {
        scrolledEnd = true; accept.disabled = false; $("acc-hint").textContent = "Accept is enabled. Good luck.";
      }
    });
    // 3.2 double-click
    ctx.on(root, "dblclick", () => lose("rightShoe", "Clause 3.2: high five received. Right shoe collected."));
    // 4.1 goose
    ctx.on(root.querySelector('[data-trap="goose"]'), "mouseenter", () => {
      if (accepted || goose || !have.lunch && honkCount >= 3) return;
      if (!goose && have.lunch) { goose = true; lose("lunch", "Clause 4.1: you adopted a goose. It ate your lunch."); renderInv(); }
    });
    // 5.1 selection
    ctx.on(document, "selectionchange", () => {
      const s = document.getSelection();
      if (!s || s.isCollapsed || voided.saturday) return;
      if (doc.contains(s.anchorNode)) lose("weekend", "Clause 5.1: you highlighted text. Weekend forfeited.");
    });
    // 5.2 typing saturday
    ctx.on(window, "keydown", e => {
      if (e.key.length !== 1) return;
      typed = (typed + e.key.toLowerCase()).slice(-8);
      if (typed === "saturday" && !voided.saturday) { voided.saturday = true; if (!have.weekend) regain("weekend", "Clause 5.2: weekend restored."); else Arcade.toast("Clause 5.2: highlighting is now safe."); }
    });
    // 6.1 timer
    const mugTimer = ctx.timeout(() => { if (!voided.hourglass) lose("mug", "Clause 6.1: two minutes passed. Your mug is soup-bound."); }, 120000);
    // 9.1 copy
    ctx.on(doc, "copy", () => lose("wifi", "Clause 9.1: Wi-Fi password transferred."));
    // 10.1 reading
    const io = new IntersectionObserver(es => { es.forEach(en => { if (en.isIntersecting && !voided.complain) ctx.timeout(() => { if (!voided.complain) lose("complain", "Clause 10.1: you read it. No complaining."); }, 700); }); }, { root: doc, threshold: 1 });
    io.observe($("trap-read")); ctx.onCleanup(() => io.disconnect());
    // 8.1 checkbox
    ctx.on($("tc-yes"), "change", e => { if (e.target.checked) lose("humor", "Clause 8.1: sense of humor confiscated as evidence."); });

    // escapes
    root.querySelectorAll("[data-esc]").forEach(el => ctx.on(el, "click", () => {
      const k = el.dataset.esc;
      if (accepted) return;
      if (k === "barefoot" && !voided.barefoot) { voided.barefoot = true; if (!have.leftShoe) regain("leftShoe", "Clause 3.3: left shoe returned."); else Arcade.toast("Clause 3.3: your left shoe is safe."); }
      if (k === "honk" && goose) { honkCount++; Arcade.beep(300, .1, "sawtooth", .08); if (honkCount >= 3) { goose = false; renderInv(); Arcade.toast("Clause 4.2: goose returned. Lunch is gone."); } }
      if (k === "hourglass" && !voided.hourglass) { voided.hourglass = true; ctx.clear(mugTimer); Arcade.toast("Clause 6.2: the clock is paused. Your mug is safe."); }
      if (k === "complain") { voided.complain = true; if (!have.complain) regain("complain", "Clause 10.2: complaint filed. Right restored."); else Arcade.toast("Clause 10.2: complaint pre-filed."); }
      if (k === "decline-wrong") Arcade.toast("Wrong decline. The Licensor reads this as enthusiasm.");
      if (k === "decline" && !voided.decline) { voided.decline = true; Arcade.toast("Clause 11.2: watering declined. Your plant thanks you."); }
      if (k === "anchor" && !anchored) { anchored = true; accept.style.left = "0px"; accept.style.top = "8px"; Arcade.toast("Clause 12.2: the Accept button is staying put."); }
    }));

    // 12.1 the shy button
    ctx.on($("acc-wrap"), "pointermove", e => {
      if (anchored || accept.disabled) return;
      const r = accept.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      if (Math.hypot(e.clientX - cx, e.clientY - cy) < 70) {
        const wrap = $("acc-wrap").getBoundingClientRect();
        const maxX = Math.max(0, wrap.width - r.width);
        accept.style.left = Math.round(Math.random() * maxX) + "px";
        accept.style.top = Math.round(Math.random() * 16) + "px";
      }
    });

    ctx.on(accept, "click", () => {
      if (!$("tc-no").checked) { Arcade.toast("Clause 8.2: to agree, check \"I do not agree\"."); return; }
      if ($("tc-yes").checked) { Arcade.toast("You can't agree and not agree. Uncheck \"I agree\"."); return; }
      finish();
    });

    function finish() {
      const name = $("tc-name").value.trim();
      if (!name) lose("name", "Clause 7.1: welcome, Customer 4471.");
      if (!voided.decline) lose("plant", "Clause 11.1: your houseplant will be watered with coffee.");
      accepted = true;
      const kept = Object.values(have).filter(Boolean).length;
      const secs = (performance.now() - t0) / 1000;
      const title = kept === 10 ? "Legal genius." : kept >= 7 ? "You read the fine print." : kept >= 4 ? "A typical user." : "You own nothing and you seem fine with it.";
      const prev = Arcade.store.get("terms:best", null);
      if (prev == null || kept > prev) Arcade.store.set("terms:best", kept);
      $("play").hidden = true;
      $("end").innerHTML = `<div class="tc-end">
        <div class="big">${kept} of 10 possessions kept.</div>
        <div style="font-size:20px;font-weight:700">${title}${goose ? " You also own a goose." : ""}</div>
        <div>Signed by <b>${Arcade.esc(have.name ? name : "Customer 4471")}</b> after ${Math.floor(secs / 60)}m ${Math.round(secs % 60)}s.</div>
        <div>Lost: ${Object.keys(ITEMS).filter(k => !have[k]).map(k => ITEMS[k]).join(", ") || "nothing"}.</div>
        <div style="opacity:.75">Best run in this browser: ${Math.max(kept, prev ?? 0)} of 10.</div>
        <div><button class="btn" id="again">Read it again</button></div></div>`;
      $("again").onclick = () => { location.hash = ""; requestAnimationFrame(() => location.hash = "terms-and-conditions"); };
    }
  },
});
