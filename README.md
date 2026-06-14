# 🐣 Commitchi

A Tamagotchi-style pet that lives in your GitHub profile README and feeds on your commits.

The pet is **Yuki**, an original snowy-owl pixel sprite.

- **Commit** and Yuki gets full and happy.
- **Go quiet** and Yuki gets hungry, then sick.
- **Disappear for 4+ days** and Yuki fades into **Yurei** (a ghost) — who returns the moment you commit again.
- Yuki also **grows up** over time: egg → baby → child → teen → adult.

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

Moods (`happy` / `hungry` / `sick`) are driven by fullness and how recently you committed, and each stage has its own mood sprite. Neglect (4+ days with no contributions) shows the Yurei ghost variant.

> Multi-species evolution (different creatures per coding pattern) is intentionally **parked** while the single Yuki mascot gets polished. The hooks (`Species`, `pickSpecies`) are still there for later.

## How it works

```
GitHub Actions (scheduled)
  → fetch your contribution activity (GraphQL)
  → update pet-state.json   (the pet's memory: age, fullness, mood, stage)
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
4. *(Optional)* To count **private** contributions too, create a PAT with the `read:user` scope and add it as a repo secret named `PET_TOKEN`. Without it, the built-in `GITHUB_TOKEN` covers public contributions.

## Run locally

```bash
npm install
npm run demo      # DEMO mode: sample data → writes pet.svg + pet-state.json
npm run preview   # renders every stage + mood (+ ghost) to ./preview/*.svg
```

With real data:

```powershell
$env:GH_USERNAME = "your-username"   # PowerShell
$env:GH_TOKEN    = "ghp_xxx"         # a token with read:user
npm run build; npm run tick
```

## Tuning

The economy lives in `src/state.ts`:

| Knob | Meaning | Default |
|---|---|---|
| `FEED_PER_CONTRIB` | fullness gained per new contribution | 12 |
| `DECAY_PER_DAY` | fullness lost per day with no feeding | 22 |
| `START_FULLNESS` | newborn fullness | 60 |

Mood thresholds are in `moodFor()` (same file); stage/neglect thresholds are in `src/evolution.ts` (`STAGE_THRESHOLDS`, `NEGLECT_DAYS`).

## Project layout

```
src/
  index.ts      orchestrates a tick
  github.ts     GraphQL fetch → contribution activity
  state.ts      load / update / save pet-state.json  (the economy)
  evolution.ts  stage progression + neglect → ghost
  sprites.ts    maps stage/mood → the right pixel sprite, embeds it as base64
  render.ts     pet.svg card assembly (SVG frame + embedded sprite, bob animation)
  preview.ts    dev-only gallery generator
  types.ts      shared types
assets/sprites/yuki/         the pixel sprites (PNG)
.github/workflows/tick.yml   the scheduled job
```

> `pet-state.json` is **not committed** in this template — the pet is born on its first run.
> The committed `pet.svg` is just an egg placeholder until then.

MIT.
