# 🐣 Commitchi

A Tamagotchi-style pet that lives in your GitHub profile README and feeds on your commits.

The pet is **Yuki**, an original snowy-owl pixel sprite.

- **Commit** and Yuki gets full and happy.
- **Go quiet** and Yuki gets hungry, then sick.
- Collaborative work raises Yuki's **happiness**, while steady commit rhythm raises
  **stamina**.
- Visitors can help once per day with **Feed** / **Play** issue links; Commitchi applies
  the care action, replies, closes the issue, and updates the pet card.
- **Disappear for 4+ days by default** and Yuki fades into **Yurei** (a ghost) — who returns the moment you commit again.
- Yuki also **grows up** over time: egg → baby → child → teen → adult.
- Evolution and 7/30/100-day streak milestones trigger a one-tick **celebration**
  badge and sparkle effect.

A GitHub Action ticks on a schedule, regenerates `pet.svg`, and commits it back so your README always shows the current pet.

## Growth stages

Stages advance purely with age:

| Stage | Age |
|---|---|
| egg | day 0 |
| baby | day 1+ |
| child | day 3+ |
| teen | day 7+ |
| adult | day 14+ |

Moods (`happy` / `hungry` / `sick`) are driven by fullness, happiness, stamina,
and how recently you committed. Each stage has its own mood sprite. Neglect
(4+ days with no contributions by default) shows the Yurei ghost variant.

> Multi-species evolution (different creatures per coding pattern) is intentionally **parked** while the single Yuki mascot gets polished. The hooks (`Species`, `pickSpecies`) are still there for later.

## How it works

```
GitHub Actions (scheduled)
  → fetch your contribution activity (GraphQL)
  → update pet-state.json   (the pet's memory: age, stats, mood, stage, milestones)
  → render pet.svg          (SVG card + the matching pixel sprite, embedded as a base64 PNG)
  → commit pet.svg + pet-state.json back to the repo
README embeds pet.svg
```

The sprite is embedded into the SVG as a base64 data URI on purpose — relative/external image references inside an SVG don't survive GitHub's image proxy, but a self-contained SVG renders reliably.

## Setup

1. Put this project in your **profile repo** (`<your-username>/<your-username>`), or any repo whose Action can commit back.
2. Embed the pet in your profile `README.md`:

   ```md
   ![my pet](./pet.svg)
   ```

3. Open the repo's **Actions** tab and run **commitchi tick** once (`workflow_dispatch`) to seed `pet.svg`. After that the schedule takes over.
4. Add visitor interaction buttons near the pet. For a profile README, use your actual
   profile repo URL:

   ```md
   [🍖 Feed](https://github.com/YOUR_USERNAME/YOUR_USERNAME/issues/new?title=commitchi%3A%20feed)
   [🎮 Play](https://github.com/YOUR_USERNAME/YOUR_USERNAME/issues/new?title=commitchi%3A%20play)
   ```

   Commitchi only acts on the exact issue titles `commitchi: feed` and `commitchi: play`.
   It ignores issue body text, lets each visitor help once per UTC day, comments a response,
   closes the interaction issue, and commits the updated `pet.svg` / `pet-state.json`.
   Successful visits show a one-tick reaction such as `냠냠!` or `신난다!` on the card.
5. *(Optional)* To count **private** contributions too, create a PAT with the `read:user` scope and add it as a repo secret named `PET_TOKEN`. Without it, the built-in `GITHUB_TOKEN` covers public contributions.
6. *(Optional)* Add `commitchi.config.json` to customize the pet name and economy. If the file is missing, Commitchi uses the defaults shown in `commitchi.config.example.json`.

## Run locally

```bash
npm install
npm run demo      # DEMO mode: sample data → writes pet.svg + pet-state.json
npm run visitor   # issue-op mode: reads ISSUE_TITLE + ISSUE_AUTHOR, updates the pet if recognized
npm run preview   # renders every stage + mood (+ ghost) to ./preview/*.svg
```

With real data:

```powershell
$env:GH_USERNAME = "your-username"   # PowerShell
$env:GH_TOKEN    = "ghp_xxx"         # a token with read:user
npm run build; npm run tick
```

## Configuration

Create `commitchi.config.json` at the repo root when you want to customize the defaults:

```json
{
  "name": "Yuki",
  "theme": "winter",
  "economy": {
    "feedPerContrib": 12,
    "decayPerDay": 22,
    "happinessDecayPerDay": 5,
    "staminaDecayPerDay": 4,
    "startFullness": 60
  },
  "thresholds": {
    "hungryFullness": 45,
    "sickFullness": 15,
    "neglectDays": 4
  }
}
```

Only the `winter` theme exists today; the field is there so more card themes can be added without changing the config shape.

| Knob | Meaning | Default |
|---|---|---|
| `economy.feedPerContrib` | fullness gained per new contribution | 12 |
| `economy.decayPerDay` | fullness lost per day with no feeding | 22 |
| `economy.happinessDecayPerDay` | happiness lost per elapsed day | 5 |
| `economy.staminaDecayPerDay` | stamina lost per elapsed day | 4 |
| `economy.startFullness` | newborn starting value for fullness, happiness, and stamina | 60 |
| `thresholds.hungryFullness` | stat level at/below which Yuki becomes hungry | 45 |
| `thresholds.sickFullness` | stat level at/below which Yuki becomes sick | 15 |
| `thresholds.neglectDays` | days without contributions before Yuki becomes Yurei | 4 |

The config file is optional and partial overrides are supported. For example, `{ "name": "Mochi" }` only changes the displayed name.

## Project layout

```
src/
  config.ts     optional commitchi.config.json loader + validation
  index.ts      orchestrates a tick
  visitor.ts    issue-op visitor feeding/play CLI
  github.ts     GraphQL fetch → contribution activity
  state.ts      load / update / save pet-state.json  (stats + economy)
  evolution.ts  stage progression + neglect → ghost
  sprites.ts    maps stage/mood → the right pixel sprite, embeds it as base64
  render.ts     pet.svg card assembly (sprite, bob animation, celebration effects)
  preview.ts    dev-only gallery generator
  types.ts      shared types
assets/sprites/yuki/         the pixel sprites (PNG)
.github/workflows/tick.yml   the scheduled job
.github/workflows/visitor.yml issue-opened visitor interactions
```

> `pet-state.json` is **not committed** in this template — the pet is born on its first run,
> then GitHub Actions commits that generated state into the user's own repo. When updating
> Commitchi later, keep your repo's `pet-state.json` so the pet does not restart.
> The committed `pet.svg` is just an egg placeholder until then.

MIT.
