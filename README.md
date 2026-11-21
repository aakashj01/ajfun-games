# Odd Little Games

Twelve small browser games. They're plain HTML, CSS and JavaScript, with no build step and no dependencies.

Open `index.html` in a browser to play, or serve the folder with any static host (GitHub Pages works).

| Game | Type | What you do |
|---|---|---|
| Hold Still | Skill | Keep your cursor still while a seismograph records every wobble. |
| Guess the Second | Skill | Hold a button for exactly 1, 2, 5, 10 and 30 seconds, with no clock. |
| Parallel Parking Simulator 3000 | Skill | Park a car with realistic steering. Scored in honks. |
| Terms & Conditions | Rules | Read a license agreement full of traps and hidden escape clauses. |
| The Captcha From Hell | Rules | Ten captchas, from traffic lights to "what does it feel like to be human?" |
| Customer Support Hold | Rules | Find your way through a phone menu to a real human. |
| How Long Is a Billion Seconds? | Scale | Scroll through a million, a billion or a trillion seconds. |
| Everything Falling | Scale | Drop 13 objects from 10 km and watch them fall in real time. |
| Lemonade Stand to Unicorn | Idle | Clicker game that satirizes startups. |
| Ant Farm Tycoon | Idle | Grow an ant colony until it eats the interface. |
| Am I Normal? | Everyone | Answer 20 questions and see what share of other players agree. |
| One Button, Whole Internet | Everyone | One shared counter that anyone can add to or reset. |

## Structure

- `index.html`: the shell, shared styles, hash router and helpers (`window.Arcade`).
- `games/*.js`: one file per game. Each calls `Arcade.register({ id, title, cat, color, spec, blurb, mount(root, ctx) })`.

Scores and saves are kept in the browser's `localStorage`.

The two "Everyone" games share data through the Claude artifact runtime (`window.claude.use("db")`). On any other host they fall back to counting only your own answers or presses.
