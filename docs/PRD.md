# Commitchi — PRD

A Tamagotchi-style pixel pet that lives in a GitHub profile README and reacts to the
owner's coding activity. The owner names their individual pet, while the fixed starter
species is **Yuki**, a snowy owl, with a **Yurei** ghost form for neglect. A scheduled
GitHub Action regenerates the pet card and commits it back.

**Product principle:** it should feel like a small persistent profile game, not a status
badge. Charm and "I don't want to lose my pet" attachment matter more than raw stats.

---

## 1. Shipped (current state)

| Area | Status |
|---|---|
| Core tick loop | ✅ GitHub Action (scheduled) → GraphQL fetch → update `pet-state.json` → render `pet.svg` → commit back |
| Mascot | ✅ user-named pet using the fixed Yuki species sprite line, original art |
| Growth stages | ✅ egg → baby → child → teen → adult (by age) |
| Stat: fullness (포만감) | ✅ fed by new contributions, decays over time |
| Stat: happiness (행복도) | ✅ boosted by collaborative activity ratio (PRs, reviews, issues), decays over time |
| Stat: stamina (체력) | ✅ boosted by steady streaks; large bursts are less efficient, decays over time |
| Moods | ✅ happy / hungry / sick, with per-stage mood sprites |
| Neglect | ✅ 4+ days no contributions by default → Yurei (ghost); returns on next commit |
| Milestone celebrations | ✅ evolution and 7/30/100-day streak milestones render a one-tick celebration badge + sparkle effect |
| Visitor feeding (issue-ops) | ✅ README Feed/Play issue links → `on: issues` workflow → title-only parser → once/day visitor rate limit → one-tick reaction badge/detail → comment + close |
| Rendering | ✅ pixel PNG embedded as base64 in SVG card; `@3x` assets keep `pet.svg` ~15KB; bob animation; winter-themed card |
| Owner config | ✅ optional `commitchi.config.json` for individual pet name, theme placeholder, stat economy/decay, and thresholds |
| GitHub render | ✅ verified that the base64-in-SVG card renders through GitHub's image proxy |
| Stack | ✅ TypeScript/Node, zero runtime deps, demo + preview scripts |

**Parked (hooks exist, intentionally off):** multi-species evolution. `Species` /
`pickSpecies` are in the code but frozen to Yuki + ghost while the single mascot is polished.

---

## 2. Roadmap (remaining MVPs)

Each remaining item is independently shippable. Effort: **S** = hours, **M** = a day or two,
**L** = multi-day and/or needs new art assets.

### A. More characters (multi-species evolution) — *requested*  · **L**
- **Goal:** the pet evolves into different creatures based on *how* you code, giving each
  user a different result and a reason to come back.
- **Scope:** at adulthood the species locks based on dominant behavior:
  streak → dragon-type, many languages → plant/chameleon-type, collaboration (PR/review) →
  bee-type, weekend-heavy → wolf-type, default → Yuki.
- **Mechanic/data:** signals already fetched in `github.ts` (streak, languageCount,
  collabRatio, weekendRatio). Re-enable `pickSpecies`; lock at adult stage.
- **Cost driver:** sprite assets per species × stage × mood. Start with **one** new species
  end-to-end before adding the rest.
- **Depends on:** nothing technically; gated by art.

### D. Death, revival & dex — *requested* · **L**
- **Goal:** real stakes (guilt-driven motivation) plus a collection meta.
- **Scope:**
  - **Death:** very long neglect (e.g., 14+ days) → the pet dies; archived to a graveyard.
  - **Revival:** committing again resurrects it (or hatches a new egg).
  - **Dex (도감):** a collection view of creatures/forms you've raised — past pets,
    unlocked species, achievements. Render a second SVG (`dex.svg`) for the README.
- **Depends on:** A (species to collect) and a richer persisted history in `pet-state.json`.

---

## 3. Additional recommendations (not yet discussed)

### F. Achievement cosmetics — **very low priority** · **M**
- Deferred. Cosmetic overlays are not a near-term MVP; revisit only after the core pet loop
  and larger collection direction are settled, and only with final transparent overlay assets.

### G. Seasonal / holiday skins — **S–M**
- Yuki is already winter-themed; seasonal palettes or holiday hats (date-driven) keep the
  card feeling alive year-round.

---

## 4. Suggested sequencing

- **Now / Next:** validate C (visitor feeding) in real profile usage before adding another loop.
- **Later:** A (more characters) and D (death/dex) — highest value but gated on sprite art.
- **Very late / backlog:** F (achievement cosmetics) and G (seasonal skins).

---

## 5. Risks & open questions

- **Art is the bottleneck** for A/D/G/H — every species/cosmetic/skin needs authored sprites.
- **File size:** more sprites embedded as base64 grows `pet.svg`; keep using `@3x` and watch
  the total.
- **Abuse** (issue-ops): current MVP uses exact-title parsing and once/day visitor limits;
  watch real usage for spam, issue permission friction, and whether limits need tuning.
- **State migrations:** `pet-state.json` now has stats; future history/dex additions should be versioned.
- **Scope discipline:** the parked-species lesson — ship one polished thing before fanning out.
