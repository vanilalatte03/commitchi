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
- Keep changes narrowly scoped and don't hand-edit generated files (`pet.svg`, `pet-state.json`).

## Character art contributions

> The community character pipeline (data-driven registry + dex + CI validation) is being
> built per [ADR 0002](./docs/adr/0002-dex-and-character-registry.md). The exact contract
> below may evolve until that lands — ADR 0002 is the source of truth.

### Rules (read before submitting)

1. **Original work only.** The art must be created by you. **Fan art or anything derived
   from existing copyrighted or trademarked characters is not accepted** and will be
   rejected — this protects you and the project legally.
2. **License grant.** By submitting, you agree to license your art under **CC BY 4.0**.
   You keep the copyright; you'll be credited in the character's `character.json` `author`
   field and in the dex.
3. **Keep it appropriate.** No NSFW, hateful, or otherwise inappropriate content.

### What a submission looks like

A PR that adds **one** character folder:

```
assets/sprites/<id>/
  character.json          # id, displayName, author, license, (optional) evolution
  egg / baby / child / teen / adult sprites, mood variants, ghost, + @3x variants
```

- Don't assign a dex number yourself — it's assigned automatically at merge time.
- See ADR 0002 for the full sprite set and manifest contract.

### Review process

1. **CI** checks the *technical contract* only — required files present and named
   correctly, PNG/canvas/size constraints, manifest schema, and dex-id uniqueness.
   CI cannot judge art style or appropriateness.
2. A **maintainer** reviews for originality/IP-safety, quality, and moderation, then
   accepts or requests changes.
3. On merge, the character is assigned its dex number and becomes selectable.

Questions or ideas? Open an issue first to discuss before investing in a full sprite set.
