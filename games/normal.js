Arcade.register({
  id: "am-i-normal",
  title: "Am I Normal?",
  cat: "everyone",
  color: "--t-sky",
  spec: "63%<br>agree",
  blurb: "Twenty small questions about how you live. After each one, see what share of everyone else agrees with you.",
  mount(root, ctx) {
    const Q = [
      ["shower", "When do you shower?", "Morning", "Night"],
      ["tp", "Toilet paper goes…", "Over", "Under"],
      ["cereal", "What goes in the bowl first?", "Cereal", "Milk"],
      ["socks", "Do you sleep with socks on?", "Yes", "Never"],
      ["ending", "Have you read the last page of a book first?", "Yes", "No"],
      ["hotdog", "Is a hot dog a sandwich?", "Yes", "No"],
      ["plants", "Do you talk to your plants or pets?", "Yes", "No"],
      ["inbox", "Your inbox right now:", "Close to zero", "Thousands unread"],
      ["argue", "Have you won an argument in the shower that never happened?", "Yes", "No"],
      ["clap", "Do you clap when the plane lands?", "Yes", "No"],
      ["pineapple", "Pineapple on pizza?", "Yes", "Absolutely not"],
      ["lock", "Do you check the door is locked after you've locked it?", "Yes", "No"],
      ["alarms", "How many alarms do you set?", "One", "More than one"],
      ["car", "Do you sing alone in the car?", "Yes", "No"],
      ["water", "Drinking water should be…", "Ice cold", "Room temperature"],
      ["gif", "How do you say GIF?", "Hard G, like gift", "Soft G, like jif"],
      ["wave", "Have you waved back at someone who was waving at someone else?", "Yes", "No"],
      ["cart", "Do you return the shopping cart?", "Always", "Sometimes"],
      ["reply", "You've read a message. Do you reply right away?", "Yes", "Later, or never"],
      ["sleep", "Which side of the bed?", "Left", "Right"],
    ];
    let mine = Arcade.store.get("normal:local", {}); // fallback copy and resume
    let counts = {}; // qid -> [n0, n1]
    let synced = false, voters = 0, sh = null, idx = 0, writing = Promise.resolve(), liveState = "connecting";

    root.innerHTML = `
      <style>
        .an { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 320px); gap: 22px; align-items: start; }
        @media (max-width: 860px) { .an { grid-template-columns: 1fr; } }
        .an-card { padding: 26px; display: grid; gap: 18px; }
        .an-q { font-family: var(--font-display); font-weight: 800; font-size: clamp(26px, 4vw, 40px); line-height: 1.08; text-wrap: balance; margin: 0; }
        .an-opts { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 520px) { .an-opts { grid-template-columns: 1fr; } }
        .an-opt { padding: 18px; font-size: 19px; font-weight: 700; border-radius: 14px; border: 2px solid var(--line); background: var(--bg); cursor: pointer; text-align: left; }
        .an-opt:hover { border-color: var(--fg); }
        .an-opt.pick { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 10%, var(--bg)); }
        .an-split { display: grid; gap: 8px; }
        .an-bar { display: flex; height: 44px; border-radius: 10px; overflow: hidden; font-weight: 700; font-size: 15px; }
        .an-bar div { display: flex; align-items: center; padding: 0 12px; white-space: nowrap; min-width: 0; transition: flex-basis .5s ease; }
        .an-bar .a { background: var(--t-sky); color: var(--ink); } .an-bar .b { background: var(--t-pink); color: var(--ink); justify-content: flex-end; }
        .an-verdict { font-size: 20px; font-weight: 700; }
        .an-side { padding: 18px; display: grid; gap: 10px; }
        .an-side h3 { margin: 0; font-family: var(--font-display); font-size: 20px; }
        .an-dots { display: grid; grid-template-columns: repeat(10, 1fr); gap: 4px; }
        .an-dots button { aspect-ratio: 1; border-radius: 4px; border: none; background: var(--surface-2); cursor: pointer; padding: 0; }
        .an-dots button.done { background: var(--t-sky); } .an-dots button.now { outline: 2px solid var(--fg); }
        .an-status { font-size: 13px; color: var(--muted); }
        .an-score { font-family: var(--font-mono); font-size: 44px; font-weight: 700; line-height: 1; }
      </style>
      <h1 class="g-title">Am I Normal?</h1>
      <p class="g-lede" style="margin-bottom:20px">Answer honestly. Your answers are saved with everyone else's, without your name, so the percentages are real people who opened this page.</p>
      <div class="an">
        <div class="panel an-card" id="card"></div>
        <aside class="panel an-side">
          <h3>Your normality</h3>
          <div class="an-score" id="score">–</div>
          <div class="muted" style="font-size:14px" id="score-note">Answer a few questions to see how often you side with the majority.</div>
          <div class="an-dots" id="dots"></div>
          <div class="an-status" id="status">Connecting to the shared results…</div>
        </aside>
      </div>`;
    const $ = id => root.querySelector("#" + id);

    function pctFor(qid, choice) {
      const c = counts[qid] || [0, 0]; const tot = c[0] + c[1];
      return tot ? Math.round(c[choice] / tot * 100) : null;
    }
    function renderSide() {
      $("dots").innerHTML = Q.map(([id], i) => `<button aria-label="Question ${i + 1}" data-i="${i}" class="${mine[id] != null ? "done" : ""} ${i === idx ? "now" : ""}"></button>`).join("");
      const answered = Q.filter(([id]) => mine[id] != null);
      const withData = answered.filter(([id]) => (counts[id] || [0, 0]).reduce((a, b) => a + b, 0) > 1);
      if (withData.length) {
        const majority = withData.filter(([id]) => { const c = counts[id]; return c[mine[id]] >= c[1 - mine[id]]; }).length;
        const s = Math.round(majority / withData.length * 100);
        $("score").textContent = s + "%";
        $("score-note").textContent = `You sided with the majority on ${majority} of ${withData.length} questions${withData.length < answered.length ? " that other people have answered" : ""}.`;
      }
      $("status").textContent = liveState === "live" ? `${voters} ${voters === 1 ? "person has" : "people have"} answered so far.`
        : liveState === "offline" ? "Shared results aren't available here, so you're only seeing your own answers. Open the published version of this page to compare with everyone."
        : liveState === "slow" ? "Still trying to reach the shared results…" : "Connecting to the shared results…";
    }
    function renderCard() {
      const [id, q, a, b] = Q[idx];
      const pick = mine[id];
      let split = "";
      if (pick != null) {
        const pa = pctFor(id, 0), c = counts[id] || [0, 0], tot = c[0] + c[1];
        if (liveState !== "live" || pa == null) split = `<div class="muted">${liveState === "live" ? "You're the first person to answer this one." : "Results from other people aren't available here."}</div>`;
        else {
          const agree = pctFor(id, pick);
          const v = tot < 2 ? "You're the only answer so far." : agree >= 80 ? "Extremely normal." : agree >= 55 ? "Normal." : agree >= 45 ? "A coin flip. Society is split." : agree >= 20 ? "Unusual. Interesting." : "Practically unique.";
          split = `<div class="an-split"><div class="an-bar"><div class="a" style="flex-basis:${Math.max(pa, 8)}%">${pa}% ${Arcade.esc(a)}</div><div class="b" style="flex-basis:${Math.max(100 - pa, 8)}%">${100 - pa}% ${Arcade.esc(b)}</div></div>
            <div class="an-verdict">${agree}% agree with you. ${v}</div><div class="muted" style="font-size:14px">${tot} answer${tot === 1 ? "" : "s"} to this question.</div></div>`;
        }
      }
      $("card").innerHTML = `<div class="muted" style="font-weight:700;font-size:13px;letter-spacing:.1em">QUESTION ${idx + 1} OF ${Q.length}</div>
        <h2 class="an-q">${Arcade.esc(q)}</h2>
        <div class="an-opts"><button class="an-opt ${pick === 0 ? "pick" : ""}" data-c="0">${Arcade.esc(a)}</button><button class="an-opt ${pick === 1 ? "pick" : ""}" data-c="1">${Arcade.esc(b)}</button></div>
        ${split}
        <div style="display:flex;gap:8px;justify-content:space-between"><button class="btn" id="prev" ${idx === 0 ? "disabled" : ""}>Back</button>${pick != null ? `<button class="btn primary" id="next">${idx === Q.length - 1 ? "See my score" : "Next question"}</button>` : ""}</div>`;
      renderSide();
    }
    ctx.on(root, "click", e => {
      const opt = e.target.closest("[data-c]"), dot = e.target.closest("[data-i]");
      if (opt) answer(+opt.dataset.c);
      if (dot) { idx = +dot.dataset.i; renderCard(); }
      if (e.target.id === "next") { if (idx < Q.length - 1) { idx++; renderCard(); } else { $("score").scrollIntoView({ behavior: "smooth", block: "center" }); Arcade.toast("Your score is on the right. Change any answer by clicking its square."); } }
      if (e.target.id === "prev" && idx > 0) { idx--; renderCard(); }
    });

    function answer(c) {
      const id = Q[idx][0];
      const prev = mine[id];
      if (prev === c) return;
      mine = { ...mine, [id]: c };
      Arcade.store.set("normal:local", mine);
      if (liveState === "live") { // optimistic count until the snapshot arrives
        const cc = (counts[id] || [0, 0]).slice(); if (prev != null) cc[prev]--; cc[c]++; counts[id] = cc;
      }
      renderCard();
      if (sh) writing = writing.then(() => sh.db.doc("votes/" + sh.uid).set({ answers: mine, updatedAt: Date.now() })).catch(err => {
        if (err && err.code === "invalid_argument") { $("status").textContent = "You can see the results but can't add answers with your current access."; }
      });
    }

    (async () => {
      sh = await Arcade.shared();
      if (ctx.dead) return;
      if (!sh) { liveState = "offline"; renderCard(); return; }
      const slow = ctx.timeout(() => { if (liveState === "connecting") { liveState = "slow"; renderSide(); } }, 10000);
      const unsub = sh.db.collection("votes").limit(1000).onSnapshot(snap => {
        const c = {}; let n = 0;
        snap.docs.forEach(d => {
          const ans = (d.data() || {}).answers || {}; let any = false;
          for (const [id] of Q) { const v = ans[id]; if (v === 0 || v === 1) { (c[id] = c[id] || [0, 0])[v]++; any = true; } }
          if (d.id === sh.uid && !Object.keys(mine).length) { mine = { ...ans }; }
          if (any) n++;
        });
        counts = c; voters = n;
        if (!snap.metadata.fromCache && !synced) {
          synced = true;
          if (!snap.docs.some(d => d.id === sh.uid) && Object.keys(mine).length && sh)
            writing = writing.then(() => sh.db.doc("votes/" + sh.uid).set({ answers: mine, updatedAt: Date.now() })).catch(() => {});
        }
        if (!snap.metadata.fromCache) { ctx.clear(slow); liveState = "live"; }
        else if (liveState === "connecting") liveState = "live";
        renderCard();
      }, () => { ctx.clear(slow); liveState = "offline"; sh = null; renderCard(); });
      ctx.onCleanup(unsub);
    })();

    const firstOpen = Q.findIndex(([id]) => mine[id] == null);
    idx = firstOpen === -1 ? 0 : firstOpen;
    renderCard();
  },
});
