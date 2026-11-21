Arcade.register({
  id: "lemonade-unicorn",
  title: "Lemonade Stand to Unicorn",
  cat: "idle",
  color: "--t-yolk",
  spec: "$1 → $1B",
  blurb: "Sell lemonade, then pivot to AI, raise a Series B, rebrand to one letter and ring the IPO bell. Lemonade optional.",
  mount(root, ctx) {
    const GENS = [
      { id: "kid", name: "Neighbor kid", cost: 15, rate: 0.2, note: "Paid in stickers." },
      { id: "stand", name: "Second stand", cost: 100, rate: 1.5, note: "Across the street from the first one." },
      { id: "intern", name: "Lemon intern", cost: 600, rate: 6, note: "Unpaid, technically." },
      { id: "app", name: "Delivery app", cost: 4000, rate: 30, note: "Lemonade arrives cold-ish." },
      { id: "sub", name: "Lemonade subscription", cost: 25000, rate: 150, note: "$29 a month. Cancel by fax." },
      { id: "dc", name: "Data center", cost: 180000, rate: 900, note: "Sells your customers' thirst data." },
      { id: "lobby", name: "Lobbyist", cost: 1200000, rate: 6000, note: "Lemonade is now a vegetable." },
    ];
    const UPS = [
      { id: "deck", name: "Make a pitch deck", cost: 50, hype: 2, note: "Twelve slides, eleven of them a hockey-stick chart." },
      { id: "craft", name: "Call it \"craft\"", cost: 250, click: 3, note: "Same lemonade, triple the price per cup." },
      { id: "ai", name: "Pivot to AI", cost: 3000, hype: 5, note: "LemonGPT predicts thirst before you feel it.", name2: "Lemonly" },
      { id: "chain", name: "Put lemons on a blockchain", cost: 12000, hype: 3, note: "Each lemon is now unique. Nobody can drink them." },
      { id: "vibes", name: "Hire a Chief Vibes Officer", cost: 40000, prod: 1.5, note: "Morale is up. Nobody knows why." },
      { id: "seriesA", name: "Raise a Series A", cost: 0, cash: 500000, needVal: 1e6, note: "Investors give you $500k for a 20-minute call." },
      { id: "rebrand", name: "Rebrand to one letter", cost: 80000, hype: 4, note: "You are now L. The logo cost $2 million.", name2: "L." },
      { id: "layoffs", name: "Announce layoffs", cost: 0, prod: 0.7, hype: 3, needVal: 5e6, note: "Production down 30%. Investors thrilled." },
      { id: "seriesB", name: "Raise a Series B", cost: 0, cash: 5e6, hype: 2, needVal: 2e7, need: "seriesA", note: "$5M. The term sheet mentions lemons zero times." },
      { id: "stop", name: "Stop selling lemonade", cost: 1e6, hype: 10, need: "seriesB", stop: true, note: "You're a platform now." },
    ];
    const HEADLINES = [
      "{n} named \"most disruptive beverage\" by a blog you've never heard of.", "Analysts unsure what {n} does. Rate it a strong buy.",
      "{n} founder spotted wearing a turtleneck in July.", "Local man asks {n} for a lemonade. Is told to download the app.",
      "{n} announces \"Lemonade for dogs\". Dogs unavailable for comment.", "Leaked memo: {n} considering selling water, but premium.",
      "{n} hires its 400th VP of Synergy.", "{n} moves HQ to a bigger tree house.", "Rival juice startup calls {n} \"basically lemonade\". {n} denies everything.",
      "{n} quarterly report: \"Vibes strong, lemons optional.\"",
    ];
    const fresh = () => ({ cash: 0, cups: 0, earned: 0, gens: {}, ups: [], name: "Your Lemonade Stand", started: Date.now(), cupsAtStop: null, ipo: false });
    let S = Object.assign(fresh(), Arcade.store.get("lemonade:save", {}));

    const hype = () => S.ups.reduce((h, id) => h * (UPS.find(u => u.id === id).hype || 1), 1);
    const prodMult = () => S.ups.reduce((h, id) => h * (UPS.find(u => u.id === id).prod || 1), 1);
    const clickVal = () => S.ups.reduce((h, id) => h * (UPS.find(u => u.id === id).click || 1), 1);
    const rps = () => GENS.reduce((a, g) => a + g.rate * (S.gens[g.id] || 0), 0) * prodMult();
    const valuation = () => Math.max(S.earned * 2, rps() * 500 * hype());
    const genCost = g => Math.ceil(g.cost * Math.pow(1.15, S.gens[g.id] || 0));
    const stopped = () => S.ups.includes("stop");
    const money = v => v >= 1e9 ? "$" + (v / 1e9).toFixed(2) + "B" : v >= 1e6 ? "$" + (v / 1e6).toFixed(2) + "M" : v >= 1e4 ? "$" + (v / 1e3).toFixed(1) + "k" : "$" + v.toFixed(v < 100 ? 2 : 0);
    const num = v => new Intl.NumberFormat("en-US").format(Math.floor(v));

    root.innerHTML = `
      <style>
        .lm-tick { overflow: hidden; white-space: nowrap; background: var(--fg); color: var(--bg); border-radius: 10px; padding: 8px 14px; font-weight: 600; font-size: 14px; margin: 16px 0; }
        .lm-tick b { color: var(--t-yolk); margin-right: 10px; letter-spacing: .1em; }
        .lm { display: grid; grid-template-columns: minmax(0, 340px) minmax(0, 1fr); gap: 22px; align-items: start; }
        @media (max-width: 860px) { .lm { grid-template-columns: 1fr; } }
        .lm-stand { display: grid; gap: 14px; justify-items: center; padding: 20px; text-align: center; }
        .lm-name { font-family: var(--font-display); font-weight: 800; font-size: 28px; line-height: 1.05; }
        .lm-sell { width: 210px; height: 210px; border-radius: 50%; border: none; cursor: pointer; background: radial-gradient(circle at 35% 30%, #FFF2A8, #FFD23F 45%, #E9B000); color: var(--ink);
          font-family: var(--font-display); font-weight: 800; font-size: 22px; box-shadow: 0 8px 0 #B98C00; transition: transform .05s; user-select: none; }
        .lm-sell:active { transform: translateY(6px); box-shadow: 0 2px 0 #B98C00; }
        .lm-sell:disabled { filter: grayscale(.8); cursor: not-allowed; }
        .lm-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; }
        .lm-stats div { text-align: left; padding: 10px 12px; border-radius: 10px; background: var(--surface-2); }
        .lm-stats span { display: block; font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); font-weight: 700; }
        .lm-stats b { font-size: 19px; }
        .lm-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        @media (max-width: 640px) { .lm-cols { grid-template-columns: 1fr; } }
        .lm-cols h3 { margin: 0 0 8px; font-family: var(--font-display); font-size: 20px; }
        .lm-item { width: 100%; text-align: left; display: grid; grid-template-columns: 1fr auto; gap: 2px 10px; padding: 10px 12px; border-radius: 10px; border: 1.5px solid var(--line); background: var(--surface); cursor: pointer; margin-bottom: 8px; }
        .lm-item:hover:not(:disabled) { border-color: var(--fg); }
        .lm-item:disabled { opacity: .5; cursor: not-allowed; }
        .lm-item b { font-weight: 700; } .lm-item small { grid-column: 1 / -1; color: var(--muted); font-size: 13px; }
        .lm-item .p { font-family: var(--font-mono); font-weight: 700; }
        .lm-ipo { padding: 22px; border-radius: 16px; background: var(--fg); color: var(--bg); display: grid; gap: 10px; margin-top: 16px; }
        .lm-ipo .big { font-family: var(--font-display); font-weight: 800; font-size: 40px; line-height: 1; }
      </style>
      <h1 class="g-title">Lemonade Stand to Unicorn</h1>
      <div class="lm-tick" id="tick"><b>NEWS</b><span id="news">A child opens a lemonade stand. Markets yawn.</span></div>
      <div class="lm">
        <div class="panel lm-stand">
          <div class="lm-name" id="nm"></div>
          <button class="lm-sell" id="sell">Sell a cup</button>
          <div class="lm-stats">
            <div><span>Cash</span><b class="mono" id="cash"></b></div>
            <div><span>Revenue</span><b class="mono" id="rps"></b></div>
            <div><span>Valuation</span><b class="mono" id="val"></b></div>
            <div><span>Cups sold</span><b class="mono" id="cups"></b></div>
          </div>
          <button class="btn" id="ipo" hidden>Ring the IPO bell</button>
          <div style="display:flex;gap:8px"><button class="btn" id="reset" style="font-size:13px;padding:6px 12px">Start over</button><button class="btn" id="reset-yes" hidden style="font-size:13px;padding:6px 12px;border-color:var(--bad);color:var(--bad)">Yes, lose everything</button></div>
        </div>
        <div>
          <div class="lm-cols">
            <div><h3>Hire</h3><div id="gens"></div></div>
            <div><h3>Strategy</h3><div id="ups"></div></div>
          </div>
          <div id="end"></div>
        </div>
      </div>`;
    const $ = id => root.querySelector("#" + id);

    function render() {
      $("nm").textContent = S.name;
      $("cash").textContent = money(S.cash); $("rps").textContent = money(rps()) + "/s";
      $("val").textContent = money(valuation()); $("cups").textContent = num(S.cups);
      $("sell").textContent = stopped() ? "We don't sell lemonade" : `Sell a cup · ${money(clickVal())}`;
      $("sell").disabled = stopped();
      $("ipo").hidden = !(valuation() >= 1e9) || S.ipo;
      setHTML("gens", GENS.map(g => {
        const c = genCost(g), n = S.gens[g.id] || 0;
        return `<button class="lm-item" data-g="${g.id}" ${S.cash < c ? "disabled" : ""}><b>${g.name}${n ? ` × ${n}` : ""}</b><span class="p">${money(c)}</span><small>+${money(g.rate)}/s each. ${g.note}</small></button>`;
      }).join(""));
      const avail = UPS.filter(u => !S.ups.includes(u.id) && (!u.need || S.ups.includes(u.need)) && (valuation() >= (u.needVal || 0) * 0.25) && S.earned >= u.cost * 0.3);
      setHTML("ups", avail.slice(0, 5).map(u => {
        const can = S.cash >= u.cost && valuation() >= (u.needVal || 0);
        const req = u.needVal && valuation() < u.needVal ? ` Needs a ${money(u.needVal)} valuation.` : "";
        return `<button class="lm-item" data-u="${u.id}" ${can ? "" : "disabled"}><b>${u.name}</b><span class="p">${u.cost ? money(u.cost) : u.cash ? "+" + money(u.cash) : "free"}</span><small>${u.note}${req}</small></button>`;
      }).join("") || `<div class="muted" style="font-size:14px">Earn more to unlock new strategies.</div>`);
    }
    const cache = {};
    function setHTML(id, html) { if (cache[id] !== html) { cache[id] = html; $(id).innerHTML = html; } }

    ctx.on(root, "click", e => {
      const gb = e.target.closest("[data-g]"), ub = e.target.closest("[data-u]");
      if (gb && !gb.disabled) { const g = GENS.find(x => x.id === gb.dataset.g), c = genCost(g); if (S.cash >= c) { S.cash -= c; S.gens[g.id] = (S.gens[g.id] || 0) + 1; Arcade.beep(660, .06, "square", .05); render(); } }
      if (ub && !ub.disabled) {
        const u = UPS.find(x => x.id === ub.dataset.u);
        if (S.cash < u.cost) return;
        S.cash -= u.cost; S.ups.push(u.id);
        if (u.cash) { S.cash += u.cash; S.earned += u.cash; }
        if (u.name2) S.name = u.name2;
        if (u.stop) S.cupsAtStop = S.cups;
        Arcade.toast(u.name + ". " + u.note); Arcade.beep(880, .15, "triangle"); render();
      }
    });
    ctx.on($("sell"), "click", () => { if (stopped()) return; const v = clickVal(); S.cash += v; S.earned += v; S.cups++; Arcade.beep(520 + Math.random() * 80, .04, "sine", .05); render(); });
    ctx.on($("ipo"), "click", () => {
      S.ipo = true; render();
      const mins = Math.round((Date.now() - S.started) / 60000);
      $("end").innerHTML = `<div class="lm-ipo"><div class="big">${S.name} is public. Valuation: ${money(valuation())}.</div>
        <div>You rang the bell after ${mins} minute${mins === 1 ? "" : "s"}. Total cups of lemonade sold: <b class="mono">${num(S.cups)}</b>.${S.cupsAtStop != null ? " The company has not sold a single cup since it became a platform." : ""}</div>
        <div style="opacity:.75">Keep playing, or start over to build another unicorn.</div></div>`;
      for (let i = 0; i < 5; i++) Arcade.beep(1046, .5, "sine", .1, i * .35);
    });
    ctx.on($("reset"), "click", () => { $("reset-yes").hidden = false; ctx.timeout(() => $("reset-yes").hidden = true, 4000); });
    ctx.on($("reset-yes"), "click", () => { S = fresh(); $("end").innerHTML = ""; $("reset-yes").hidden = true; save(); render(); });

    let lastRender = 0;
    ctx.interval(() => {
      const r = rps() / 10;
      S.cash += r; S.earned += r;
      if (!stopped()) S.cups += r / 1; // one cup per dollar from the stands
      if (performance.now() - lastRender > 400) { lastRender = performance.now(); render(); }
    }, 100);
    ctx.interval(() => { $("news").textContent = HEADLINES[Math.floor(Math.random() * HEADLINES.length)].replaceAll("{n}", S.name); }, 9000);
    const save = () => Arcade.store.set("lemonade:save", S);
    ctx.interval(save, 5000); ctx.onCleanup(save);
    render();
  },
});
