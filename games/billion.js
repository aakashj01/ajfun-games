Arcade.register({
  id: "billion-seconds",
  title: "How Long Is a Billion Seconds?",
  cat: "scale",
  color: "--t-lime",
  spec: "1,000,<br>000,000",
  blurb: "Scroll through a million, a billion or a trillion seconds. Watch a lifetime and then most of human history go by.",
  mount(root, ctx) {
    const YEAR = 31557600, DAY = 86400;
    const SCALES = {
      million: { n: 1e6, label: "A million seconds", dir: "from right now", items: [
        [60, "One minute. You've read this far."], [3600, "One hour. About one podcast episode."], [7200, "Two hours. A long movie."],
        [28800, "Eight hours. A full night's sleep, if you're lucky."], [DAY, "One day."], [2 * DAY, "A weekend."], [3 * DAY, "Three days. Roughly how long a person can go without water."],
        [7 * DAY, "One week."], [1e6, "One million seconds: 11 days, 13 hours, 46 minutes and 40 seconds. Two weeks of vacation, nearly."]] },
      billion: { n: 1e9, label: "A billion seconds", dir: "from the day you're born", items: [
        [YEAR, "Your first birthday. You won't remember it."], [2 * YEAR, "Age two. You discover the word no."], [5 * YEAR, "Age five. First day of school."],
        [10 * YEAR, "Age ten. Double digits."], [13 * YEAR, "Thirteen. A teenager, with opinions."], [16 * YEAR, "Sixteen. Driving age in many places."],
        [18 * YEAR, "Eighteen. Legally an adult. Not actually one."], [25 * YEAR, "Twenty-five. Your brain has roughly finished developing."],
        [30 * YEAR, "Thirty."], [1e9, "One billion seconds. You are 31 years and about 8 months old."]] },
      trillion: { n: 1e12, label: "A trillion seconds", dir: "back in time from today", items: [
        [100 * YEAR, "100 years ago. Your great-grandparents, probably."], [1000 * YEAR, "1,000 years ago. The Middle Ages in Europe."],
        [2000 * YEAR, "2,000 years ago. The Roman Empire."], [4500 * YEAR, "4,500 years ago. The Great Pyramid of Giza is built."],
        [5200 * YEAR, "About 5,200 years ago. Some of the earliest known writing, in Mesopotamia."], [10000 * YEAR, "10,000 years ago. Farming is spreading."],
        [11600 * YEAR, "About 11,600 years ago. People build Göbekli Tepe, one of the oldest known monuments."],
        [20000 * YEAR, "About 20,000 years ago. The peak of the last ice age."],
        [1e12, "One trillion seconds ago: 31,688 years. Mammoths walk across Europe, and people are already painting caves."]] },
    };
    let scale = "billion";
    const TRACK = 16000;

    root.innerHTML = `
      <style>
        .bs-intro { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 22px; margin: 18px 0 28px; }
        @media (max-width: 820px) { .bs-intro { grid-template-columns: 1fr; } }
        .bs-cmp { padding: 18px; display: grid; gap: 12px; }
        .bs-cmp .r { display: grid; grid-template-columns: 110px 1fr; gap: 12px; align-items: baseline; }
        .bs-cmp .r b { font-size: 22px; font-family: var(--font-display); }
        .bs-calc { padding: 18px; display: grid; gap: 10px; }
        .bs-calc input { border: 1.5px solid var(--line); border-radius: 8px; padding: 8px 10px; background: var(--bg); }
        .bs-age { font-size: 26px; font-weight: 700; }
        .bs-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
        .bs-sticky { position: sticky; top: calc(env(safe-area-inset-top, 0px) + 58px); z-index: 5; background: var(--bg); padding-block: 12px; border-bottom: 1px solid var(--line); }
        .bs-count { font-size: clamp(34px, 7vw, 72px); font-weight: 700; line-height: 1; letter-spacing: -0.02em; }
        .bs-human { font-size: 18px; font-weight: 600; color: var(--muted); margin-top: 4px; }
        .bs-progress { height: 6px; background: var(--surface-2); border-radius: 3px; margin-top: 10px; overflow: hidden; }
        .bs-progress i { display: block; height: 100%; background: var(--t-lime); width: 0; }
        .bs-track { position: relative; }
        .bs-ruler { position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: var(--line); }
        .bs-card { position: absolute; left: 22px; right: 0; max-width: 560px; padding: 14px 16px; display: grid; gap: 8px; }
        .bs-card::before { content: ""; position: absolute; left: -27px; top: 18px; width: 12px; height: 12px; border-radius: 50%; background: var(--t-lime); border: 2px solid var(--fg); }
        .bs-card .t { font-size: 13px; color: var(--muted); font-weight: 700; }
        .bs-card .e { font-weight: 600; font-size: 17px; }
        .bs-end { position: absolute; left: 0; right: 0; bottom: 0; text-align: center; color: var(--muted); }
      </style>
      <h1 class="g-title">How Long Is a Billion Seconds?</h1>
      <p class="g-lede">People say million and billion like they're neighbors. They aren't. Pick a scale and scroll: the counter moves at a constant rate, so the page length is the time.</p>
      <div class="bs-intro">
        <div class="panel bs-cmp">
          <div class="r"><span class="muted">1 million s</span><b>11.6 days</b></div>
          <div class="r"><span class="muted">1 billion s</span><b>31.7 years</b></div>
          <div class="r"><span class="muted">1 trillion s</span><b>31,688 years</b></div>
          <div class="muted" style="font-size:14px">If a million seconds were 1 millimeter, a billion would be 1 meter and a trillion would be 1 kilometer.</div>
        </div>
        <div class="panel bs-calc">
          <label for="bday" style="font-weight:700">When were you born?</label>
          <input type="date" id="bday">
          <div class="bs-age mono" id="age"></div>
          <div id="bmsg" class="muted"></div>
        </div>
      </div>
      <div class="bs-sticky">
        <div class="bs-tabs" id="tabs">${Object.entries(SCALES).map(([k, s]) => `<button class="chip" data-s="${k}" aria-pressed="${k === scale}">${s.label}</button>`).join("")}</div>
        <div style="margin-top:12px"><div class="bs-count mono" id="count">0</div><div class="bs-human" id="human"></div>
        <div class="bs-progress"><i id="bar"></i></div></div>
      </div>
      <div class="bs-track" id="track" style="height:${TRACK}px"><div class="bs-ruler"></div><div id="cards"></div><div class="bs-end" id="endnote"></div></div>`;

    const $ = id => root.querySelector("#" + id);
    const nf = new Intl.NumberFormat("en-US");

    function human(sec) {
      if (sec < 60) return `${Math.floor(sec)} seconds`;
      const y = Math.floor(sec / YEAR); let r = sec - y * YEAR;
      const d = Math.floor(r / DAY); r -= d * DAY;
      const h = Math.floor(r / 3600), m = Math.floor((r - h * 3600) / 60);
      const parts = [];
      if (y) parts.push(`${nf.format(y)} year${y === 1 ? "" : "s"}`);
      if (d) parts.push(`${d} day${d === 1 ? "" : "s"}`);
      if (!y) { if (h) parts.push(`${h} hour${h === 1 ? "" : "s"}`); if (!d && m) parts.push(`${m} minute${m === 1 ? "" : "s"}`); }
      return parts.join(", ") || "0 seconds";
    }

    function layout() {
      const s = SCALES[scale], vh = window.innerHeight, span = TRACK - vh;
      const groups = [];
      for (const [sec, text] of s.items) {
        const y = sec / s.n * span + vh * 0.5;
        const last = groups[groups.length - 1];
        if (last && y - last.y < 140) last.items.push([sec, text]); else groups.push({ y, items: [[sec, text]] });
      }
      $("cards").innerHTML = groups.map(gp => `<div class="panel bs-card" style="top:${Math.min(gp.y, TRACK - 160)}px">${gp.items.map(([sec, text]) =>
        `<div><div class="t mono">${nf.format(Math.round(sec))} s ${s.dir}</div><div class="e">${Arcade.esc(text)}</div></div>`).join("")}</div>`).join("");
      $("endnote").textContent = "";
      update();
    }
    function update() {
      const s = SCALES[scale], r = $("track").getBoundingClientRect(), vh = window.innerHeight;
      const p = Math.max(0, Math.min(1, -r.top / (TRACK - vh)));
      const sec = p * s.n;
      $("count").textContent = nf.format(Math.round(sec));
      $("human").textContent = (scale === "trillion" ? "" : "") + human(sec) + (scale === "trillion" ? " ago" : "");
      $("bar").style.width = (p * 100).toFixed(2) + "%";
    }
    root.querySelectorAll("[data-s]").forEach(b => ctx.on(b, "click", () => {
      scale = b.dataset.s;
      root.querySelectorAll("[data-s]").forEach(x => x.setAttribute("aria-pressed", x === b));
      const top = $("track").getBoundingClientRect().top + window.scrollY - 200;
      if (window.scrollY > top) window.scrollTo({ top });
      layout();
    }));
    ctx.on(window, "scroll", update, { passive: true });
    ctx.on(window, "resize", layout);
    layout();

    // birthday calculator
    const saved = Arcade.store.get("billion:bday", "");
    if (saved) $("bday").value = saved;
    function calc() {
      const v = $("bday").value;
      if (!v) { $("age").textContent = ""; $("bmsg").textContent = "Enter a date to see your age in seconds and the day you turn one billion seconds old."; return; }
      Arcade.store.set("billion:bday", v);
      const born = new Date(v + "T00:00:00").getTime();
      const age = (Date.now() - born) / 1000;
      if (age < 0) { $("age").textContent = ""; $("bmsg").textContent = "That's in the future. Welcome, time traveler."; return; }
      $("age").textContent = nf.format(Math.floor(age)) + " seconds old";
      const bill = new Date(born + 1e9 * 1000), two = new Date(born + 2e9 * 1000);
      const opts = { year: "numeric", month: "long", day: "numeric" };
      const days = Math.round((bill - Date.now()) / 864e5);
      $("bmsg").textContent = days > 0
        ? `You turn one billion seconds old on ${bill.toLocaleDateString("en-US", opts)}, in ${nf.format(days)} days. Plan a party.`
        : `You turned one billion seconds old on ${bill.toLocaleDateString("en-US", opts)}. Two billion arrives on ${two.toLocaleDateString("en-US", opts)}.`;
    }
    ctx.on($("bday"), "input", calc);
    calc(); ctx.interval(() => { if ($("bday").value) { const born = new Date($("bday").value + "T00:00:00").getTime(); const a = (Date.now() - born) / 1000; if (a > 0) $("age").textContent = nf.format(Math.floor(a)) + " seconds old"; } }, 1000);
  },
});
