# Contributing to Commitchi

Thanks for your interest! Two kinds of contributions are covered here: **code** and
**character art**.

## Licensing summary

- **Code** is licensed under the **MIT License** ([LICENSE](./LICENSE)).
- **Character/sprite art** is licensed under **CC BY 4.0** ([LICENSE-ASSETS.md](./LICENSE-ASSETS.md)).

By opening a pull request, you agree that your contribution is licensed under the terms
above and that it is your own work to give.

## Code contributions

- Keep TypeScript strict; prefer existing modules/patterns (see [AGENTS.md](./AGENTS.md)).
- Run `npm run build` (and `npm run demo` / `npm run preview` when relevant) before opening a PR.
- Keep changes narrowly scoped and don't hand-edit generated files (`pet.svg`, `dex.svg`, `pet-state.json`).

---

# Adding a character

A character is **data only** — a folder of sprites plus a small manifest. No code changes
are needed; the registry discovers and validates it automatically. This section is the
complete contract: everything you need is here.

> Tip: open an issue first if you want feedback before drawing a full set.

## The rules (4)

1. **Pixel art.** Any clean pixel-art style is welcome — you do **not** have to match
   Yuki's look. (Style cohesion is optional; see the [style guide](docs/sprite-style-guide.md)
   if you want help, especially with AI generation.)
2. **Original & IP-safe.** The art must be your own. **Fan art or anything derived from
   existing copyrighted/trademarked characters is rejected** — this protects you and the
   project. AI-assisted art is OK only if it's from your own prompt/direction, doesn't
   imitate existing IP or a specific artist, and you can license it under CC BY 4.0.
3. **Match the technical contract** below (files, names, sizes, manifest). This is the
   only part CI can check.
4. **Keep it appropriate.** No NSFW, hateful, or otherwise inappropriate content.

You keep your copyright and are credited in `character.json` (`author`) and the dex. See
[MODERATION.md](./MODERATION.md) for the full content/IP policy and takedown process.

## What to make

### 1. Sprites — 14 states

Each character needs these 14 sprite states. `egg` has no moods; `baby`/`child`/`teen`
ship a default (happy) plus `-hungry`/`-sick`; `adult` has three explicit moods; plus one
`ghost` (the neglect form).

| Stage | Files |
|---|---|
| egg | `egg` |
| baby | `baby` · `baby-hungry` · `baby-sick` |
| child | `child` · `child-hungry` · `child-sick` |
| teen | `teen` · `teen-hungry` · `teen-sick` |
| adult | `adult-happy` · `adult-hungry` · `adult-sick` |
| ghost | `ghost` |

Ship **each state twice**: a base `name.png` and a high-res `name@3x.png` (28 files
total). The card embeds the **`@3x`** version — that is the one CI validates:

- **Transparent** PNG (must have an alpha channel).
- **32–320px** per side (≈192px recommended).
- **≤ 80KB** each.

Tip: generate large, then downscale to ~192px and optimize with `pngquant`/`oxipng`.

### 2. Manifest — `character.json`

| Field | Value |
|---|---|
| `id` | lowercase, `^[a-z][a-z0-9-]*$`, **matches the folder name** |
| `displayName` | name shown on the card / dex (e.g. `Yuki`) |
| `ghostName` | name shown in the neglect/ghost form (e.g. `Yurei`) |
| `author` | your GitHub handle |
| `license` | `CC-BY-4.0` |

```json
{
  "id": "yourchar",
  "displayName": "YourChar",
  "ghostName": "YourGhost",
  "author": "your-github-handle",
  "license": "CC-BY-4.0"
}
```

### 3. Folder layout

```
assets/sprites/<id>/
  character.json
  egg.png            egg@3x.png
  baby.png           baby@3x.png
  baby-hungry.png    baby-hungry@3x.png
  baby-sick.png      baby-sick@3x.png
  child.png          child@3x.png      (+ -hungry, -sick, each with @3x)
  teen.png           teen@3x.png       (+ -hungry, -sick, each with @3x)
  adult-happy.png    adult-happy@3x.png
  adult-hungry.png   adult-hungry@3x.png
  adult-sick.png     adult-sick@3x.png
  ghost.png          ghost@3x.png
```

## Submitting

1. Draw the 14 states in any pixel style.
2. Export each as `name.png` + `name@3x.png` with the exact names above.
3. Add `character.json` with the fields above.
4. Register the character in [`catalog.json`](./catalog.json): append one entry to the
   `characters` array using the **next unused number**:

   ```json
   { "number": 4, "id": "yourchar" }
   ```

   Every character folder must have a catalog entry, so CI fails without it. Numbers are
   ordered and never reused (gaps are fine). If two PRs happen to grab the same number, a
   maintainer will renumber yours at merge — so don't worry about racing.
5. Open a PR with your `assets/sprites/<id>/` folder **and** that one-line `catalog.json`
   change.

Check it locally before opening the PR:

```bash
npm run validate:characters
```

## Review

1. **CI** checks the *technical contract* only — required files present and named
   correctly, PNG transparency/size, manifest schema, id↔folder, and dex uniqueness.
   It cannot judge art style or appropriateness.
2. A **maintainer** reviews for originality/IP-safety, quality, and moderation (and
   confirms/adjusts your catalog number).
3. On merge, the character becomes selectable — by its dex number or its `id`.

Background on why the system is shaped this way:
[ADR 0002](docs/adr/0002-dex-and-character-registry.md).
