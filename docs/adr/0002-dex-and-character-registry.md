# ADR 0002: Dex and Data-Driven Character Registry

## Status

Accepted. Phase 1 (data-driven character registry: manifest + `catalog.json` +
`src/characters.ts`, `Species` as id, ghost as a render variant) is implemented and merged
(#13). Additional registered characters, character validation CI, and config-based active
character selection are implemented. The multi-pet roster/switching foundation and
per-user dex progress tracking are implemented through `pet-state.json` schema v2. Dex
card display is implemented (도감 카드 표시 구현됨) as raised characters / total catalog
characters in the pet card footer. Stage display-lock remains unimplemented, and
`dex:assign` remains accepted direction, not yet built.

## Context

Commitchi today is a single evolving pet: one user, one Yuki (with a Yurei ghost
form for neglect). The growth loop (egg → adult) and neglect → ghost are what create
the "I don't want to lose my pet" attachment from the PRD.

We now want to grow the world without breaking that loop:

- Let owners **pin the displayed stage** (e.g. keep showing the baby sprite) once
  they've unlocked it, like a collection preference.
- Add a **dex** (도감) with stable numbers, matching the collectible direction already
  recorded in ADR 0001.
- Eventually let **anyone contribute their own original characters via PR**, with CI
  checking that the required assets/metadata exist and a human (maintainer) accepting
  the art.

The codebase already has the hooks for this: `pickSpecies` and the `lockedSpecies`
field exist but multi-species is intentionally frozen (see ADR 0001, `evolution.ts`,
`types.ts`). `sprites.ts` currently hardcodes `assets/sprites/yuki`, so adding a
character means editing code — that is the main thing this ADR changes.

## Decision

### 1. Cosmetic stage display lock (not a progression freeze)

Separate **what the pet is** (`PetState`: real age, stats, stage, decay) from **what
is rendered**. The simulation keeps advancing underneath; the owner may only choose
which *already-unlocked* stage sprite to display.

- New config/state field, e.g. `displayStage: "auto" | Stage` (default `"auto"`).
- A stage can be selected only if it is unlocked in the dex for the active character.
- Decay, ageing, evolution, and neglect → ghost continue regardless of display choice.

Rationale: a hard freeze ("stay baby forever") would let users switch off the very
loop that drives attachment. Cosmetic control satisfies the real preference without
killing the game.

### 2. One active pet, switchable; inactive pets frozen ("light collection")

A user keeps **persistent state for multiple unlocked characters**, but exactly **one
is active** and shown on the README card.

- Only the **active** pet is live: commits feed it, and it decays / can go ghost.
- **Inactive** pets are **frozen** at their last state (no decay) — the single commit
  stream can only fairly feed one pet, and decaying idle pets would punish collecting.
- Switching the active character is allowed at any time and resumes that pet where it
  was frozen.

This keeps the single-pet emotional focus on the card while enabling collection.

**No switching cooldown (initially).** Neglect → ghost is recomputed every tick from the
owner's real commit gap (`daysSinceLastContribution`), not from an internal timer, so
freezing a pet by switching away cannot dodge the ghost beat — a neglected pet ghosts
again the moment it resumes if commits are still absent. Freezing only pauses stat decay
(fullness/happiness/stamina), which has little abuse value. A lightweight guard (e.g. one
switch per day) can be added later if churn becomes a problem.

### 3. Dex = global catalog + per-user unlock progress

Two distinct layers:

- **Global catalog** (in-repo, single source of truth): every character that exists,
  each with a stable **dex number** (`No.1 Yuki`, …). Numbers are assigned at
  acceptance time, sequential, and **never reused**.
- **Per-user unlock progress** (in `pet-state.json`): which characters/stages this user
  has **actually raised** — an entry fills as the active pet reaches each stage.

**Recording format:**

- Dex numbers live in an append-only `catalog.json` registry (the source of truth for
  numbers), *not* in each `character.json` — so concurrent PRs don't fight over the next
  number. A build script (`npm run dex:assign`, run at merge) finds folders missing a
  catalog entry and appends the next number; CI checks the sequence is unique, gap-free,
  and that every id maps to a real folder. No manual numbering by contributors.
- Per-user progress is stored under `pet-state.json` as `dex[id]`. Because stages are
  linear (egg < baby < child < teen < adult), a single `maxStage` per character is
  enough:

  ```jsonc
  "dex": {
    "yuki": { "firstSeenAt": "2026-…", "maxStage": "child" }
  }
  ```

  `maxStage` drives both "collected" status and the stage display-lock range (Decision 1):
  a stage is pinnable iff it is `<= dex[id].maxStage`. Progress "12/30" counts characters
  with any `dex` entry; full completion counts those with `maxStage === "adult"`.

### 4. Character access: free choice; dex earned by raising

Access and collection are deliberately separate:

- **Access (free choice):** a user may pick *any* catalog character to raise at any
  time — no gating. This matches the open-gallery goal ("browse and try raising one you
  like") and scales to a large community catalog, where a fixed unlock order is
  meaningless.
- **Dex completion (earned):** a character's dex entry fills only as you *actually
  raise it* and it reaches each stage. "Collected" means "raised", so the collectible
  goal survives free access — completing the dex still takes real play.
- This also supplies the stage display-lock condition (Decision 1): a stage becomes
  pinnable once the dex records that this character reached it.

`pickSpecies` (coding-pattern selection) is **not** the access mechanism and is not
required to obtain a character. It may later be repurposed as an *optional* trigger for
special / limited characters (e.g. a high collaboration ratio unlocks a rare one), as
flavor layered on top of free choice.

### 5. Data-driven character registry

Adding a character must be **data-only** — drop a folder plus a manifest, no code
change. This is the shared prerequisite for both multi-species and community PRs.

Proposed layout:

```
assets/sprites/<species>/
  character.json          # manifest (see contract below)
  egg.png  egg@3x.png
  baby.png baby-hungry.png baby-sick.png  (+ @3x)
  child.png child-hungry.png child-sick.png (+ @3x)
  teen.png  teen-hungry.png  teen-sick.png  (+ @3x)
  adult-happy.png adult-hungry.png adult-sick.png (+ @3x)
  ghost.png ghost@3x.png
```

`sprites.ts` becomes a loader/registry that discovers characters from
`assets/sprites/*` and validates each against the manifest, instead of hardcoding Yuki.
`Species` stops being a fixed union and becomes a registered id.

### 6. Community contribution flow

- Contributor opens a PR adding one `assets/sprites/<species>/` folder + manifest.
- **CI validates the technical contract only** (see below) — it cannot judge art.
- **Human (maintainer) is the acceptance gate** for taste, IP-safety, and moderation.
- Dex number is assigned by the maintainer / a script **at merge time**, not chosen in
  the PR (avoids collisions between concurrent PRs).

## Character contract

**Manifest (`character.json`):**

| Field | Meaning |
|---|---|
| `id` | unique species id (folder name), lowercase |
| `displayName` | shown on the card / dex |
| `ghostName` | name shown in the neglect/ghost form |
| `author` | contributor credit (GitHub handle) |
| `license` | must affirm original work + project license grant (`CC-BY-4.0`) |
| `evolution` | *(proposed, not implemented)* per-stage age thresholds; today all characters use the shared curve |

> Implemented manifest fields are `id`, `displayName`, `ghostName`, `author`, `license`
> (see `src/characters.ts`). [CONTRIBUTING.md](../../CONTRIBUTING.md) is the contributor-facing contract.

**Required sprite set:** 5 stages × mood variants where applicable + ghost, each with an
`@3x` variant, transparent background, fixed source canvas (e.g. 192px), under a size cap.

## CI validation (technical only)

- All required sprite files present and correctly named.
- PNG format, transparent background, expected canvas size, per-file size cap.
- `character.json` matches schema; `id` matches folder; `license` field present.
- Dex `id` not already taken in the catalog.
- Project still builds and `npm run preview` renders the new character without error.

CI explicitly does **not** check art style or appropriateness — that is the human gate.

## Style vs. licensing posture

The long-term intent is an **open gallery**: contributors may upload their own original
SD/anime-style characters freely, and users pick one they like to raise. This changes
the curation axis:

- Art-style consistency with Yuki is **no longer required**.
- **IP/copyright becomes the #1 risk.** "Anything goes" tends to attract fan art of
  existing IP, which we must not host/distribute. `CONTRIBUTING.md` must require
  **original work + an explicit license grant**, and the human review must reject IP
  infringement.
- **Moderation** (NSFW/offensive) is also human-gated.
- **License + moderation policy docs must land before the gallery opens.**

## Consequences

- Enables the dex, multi-character switching, and community contributions on top of the
  existing loop, without weakening the "don't lose my pet" attachment.
- Requires non-trivial refactors: `pet-state.json` schema (multi-pet + dex + display
  choice), `sprites.ts` → registry/loader, `Species` from fixed union → registered id,
  and `evolution.ts`/`render.ts` threading the active character through.
- `pet-state.json` migration: existing single-pet states must upgrade cleanly (treat the
  current pet as the active Yuki, seed dex unlocks from its history).
- Opening the gallery adds an ongoing **maintenance + legal/moderation burden** that CI
  cannot remove.
- More embedded PNGs across characters increase repo size (per-character, on disk; each
  rendered card still embeds only the active sprite).

## Out of scope / non-goals

- Multiple pets shown at once (full collection on the card) — not planned; one active.
- Achievement / `pickSpecies`-style unlocks — **not now.** Access is free choice only
  (Decision 4); `pickSpecies` stays parked and may be revisited for special/limited
  characters in a future ADR.

## Migration (required, not optional)

The new `pet-state.json` schema v2 adds an active-character pointer, per-character
states, and `dex`. Existing users already have an old single-pet file committed, so the
loader must upgrade it in place — never crash or reset the existing pet to an egg:

- keep the existing pet in the roster under `lockedSpecies`, its registered `species`,
  or the default character id;
- seed `dex[id].maxStage` from its current stage (credit what's already raised);
- set `active` from `config.character`; if that differs from the migrated pet id,
  create a fresh active egg and leave the migrated pet frozen.

This is the same defensive-load pattern `loadState` already uses (`normalizeStat`
fallbacks), applied to the new fields — a decided requirement, not a design choice.

## Open questions

- Final field layout of `pet-state.json` is settled for schema v2:

  ```jsonc
  {
    "schemaVersion": 2,
    "active": "<id>",
    "pets": {
      "<id>": {
        // PetState unchanged
      }
    },
    "dex": {
      "<id>": {
        "firstSeenAt": "<iso>",
        "maxStage": "<stage>"
      }
    }
  }
  ```

- The exact `catalog.json` assignment automation shape remains future work with
  `dex:assign`.

## References

- ADR 0001 — Pixel-Art Pet Sprites (collectible dex direction, sprite/rendering rules).
- `src/evolution.ts` (`pickSpecies`, `resolveEvolution`), `src/types.ts`
  (`Species`, `lockedSpecies`, `PetState`), `src/sprites.ts` (current hardcoded loader).
