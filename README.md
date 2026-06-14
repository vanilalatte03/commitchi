# 🐣 Commitchi

A Tamagotchi pet that lives in your GitHub profile README and feeds on your commits.

- **Commit** and it gets full and happy.
- **Go quiet** and it gets hungry, then sick.
- A GitHub Action ticks every 6 hours, regenerates `pet.svg`, and commits it back.

> MVP: single species (Night Owl), one stat (포만감/fullness), three moods (기분 좋음 · 배고픔 · 아파요), animated SVG (bob + blink).
> Roadmap: evolution tree, happiness & energy stats, visitor "feed" buttons (issue-ops), death & revival, a collection/Pokédex.

## How it works

```
GitHub Actions (cron 6h)
  → fetch your contribution calendar (GraphQL)
  → update pet-state.json   (the pet's memory: age, fullness, mood)
  → render pet.svg          (Tier C vector owl, mood-aware, animated)
  → commit both back to the repo
README embeds pet.svg
```

## Setup

1. Put this project in your **profile repo** (`<your-username>/<your-username>`), or any repo whose Action can commit back.
2. Embed the pet in your profile `README.md`:

   ```md
   ![my pet](./pet.svg)
   ```

3. Go to the repo's **Actions** tab and run **commitchi tick** once (`workflow_dispatch`) to seed `pet.svg`. After that, cron takes over.
4. *(Optional)* To count **private** contributions too, create a PAT with the `read:user` scope and add it as a repo secret named `PET_TOKEN`. Without it, the built-in `GITHUB_TOKEN` covers public contributions.

## Run locally

```bash
npm install
npm run demo          # DEMO mode: sample data → writes pet.svg + pet-state.json
```

With real data:

```bash
$env:GH_USERNAME="your-username"   # PowerShell
$env:GH_TOKEN="ghp_xxx"            # a token with read:user
npm run build && npm run tick
```

## Tuning

Open `src/state.ts` and tweak the economy:

| Knob | Meaning | Default |
|---|---|---|
| `FEED_PER_CONTRIB` | fullness gained per new contribution | 12 |
| `DECAY_PER_DAY` | fullness lost per day with no feeding | 22 |
| `START_FULLNESS` | newborn fullness | 60 |

Mood thresholds live in `moodFor()` in the same file.

## Project layout

```
src/
  index.ts    orchestrates a tick
  github.ts   GraphQL contribution fetch
  state.ts    load / update / save pet-state.json  (the economy)
  render.ts   pet.svg generator (Tier C vector + SMIL animation)
  types.ts    shared types
.github/workflows/tick.yml   the cron job
```

MIT.
