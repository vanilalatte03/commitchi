# AGENTS.md

## Scope
- This file applies to the whole repository.
- If a nested `AGENTS.md` exists later, follow the nested file for that subtree.

## Project Overview
- Commitchi is a TypeScript/Node.js project that renders a Tamagotchi-style pet SVG for a GitHub profile README.
- Source files live in `src/`.
- Build output lives in `dist/`.
- Product and design docs live in `docs/`.
- Runtime/generated artifacts include `pet.svg`, `pet-state.json`, and `preview/*.svg`.

## Encoding
- When reading or printing Korean/UTF-8 files in Windows PowerShell, set the console to UTF-8 first.
- If Korean text looks broken, do not assume file corruption; retry with explicit UTF-8 settings.

```powershell
chcp 65001
[Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
Get-Content -Encoding UTF8 <path>
```

## Common Commands
- Install dependencies: `npm install`
- Type-check/build: `npm run build`
- Demo render with sample activity: `npm run demo`
- Render preview SVGs: `npm run preview`
- Run visitor interaction flow: `npm run visitor`

## Code Guidelines
- Keep TypeScript strict and avoid weakening types.
- Prefer existing modules and patterns over new abstractions.
- Keep GitHub API logic in `src/github.ts`.
- Keep state transitions and rules in `src/state.ts` and `src/evolution.ts`.
- Keep rendering logic in `src/render.ts` and sprite data in `src/sprites.ts`.
- Keep user-facing strings/localization in `src/i18n.ts`.
- Add dependencies only when the benefit is clear and the standard library is not enough.

## Change Guidelines
- Keep changes narrowly scoped to the requested behavior.
- Do not rewrite generated files unless the source change requires refreshed output.
- If renderer, state, or sprite behavior changes, consider whether `pet.svg` or `preview/*.svg` should be regenerated.
- If README behavior changes, keep `README.md` and `README.ko.md` aligned when practical.
- Preserve the GitHub Actions/profile README workflow described in the docs.

## Verification
- Run `npm run build` after TypeScript changes.
- Run `npm run demo` after state, config, rendering, or output changes.
- Run `npm run preview` after sprite or visual layout changes.
- Check `git diff` before finishing and call out any generated-file changes.
