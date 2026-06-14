# Commitchi Design Direction

## Summary

Commitchi should feel like a small collectible pet people want to keep in their GitHub README, not like a generated status badge with a mascot icon.

The next direction is retro monster-pet pixel art:

- Render the README card, text, progress bars, and dynamic state with generated SVG.
- Render the pet as a small original pixel-art sprite.
- Use the visual language of 90s handheld monster-raising RPGs as inspiration.
- Do not copy Pokemon characters, silhouettes, names, palettes, or exact UI.

This gives Commitchi a clearer product taste: small, collectible, game-like, and nostalgic.

## Direction Decision

Move away from polished vector mascots for now.

Use a hybrid pixel-sprite rendering model:

```text
pet.svg
├─ generated SVG
│  ├─ card frame
│  ├─ name and labels
│  ├─ mood text
│  ├─ fullness bar
│  └─ simple pixel-friendly effects
└─ pixel character sprite
   ├─ egg / baby / child / teen / adult
   ├─ happy / hungry / sick
   └─ species variants after the base sprite works
```

The card stays dynamic and GitHub-friendly. The character becomes a crafted sprite asset instead of procedural vector drawing.

## Why Pixel Art

The current vector direction keeps drifting into "almost cute, but wrong." Small proportion mistakes are very visible in vector character art.

Pixel art gives the product stronger constraints:

- Lower detail means fewer awkward anatomy mistakes.
- Tiny sprites are expected to be symbolic, not fully illustrated.
- Growth stages can read clearly through silhouette and palette changes.
- README scale works naturally because the sprite is already designed small.
- The collectible-game feeling becomes immediate.

This is a better fit for a commit-fed virtual pet than smooth mascot illustration.

## IP Boundary

"Pokemon-like" is a useful shorthand for the desired feeling, but the implementation must be original.

Allowed references:

- Small monster-raising game feeling.
- Limited-palette pixel sprites.
- Evolution stages.
- Battle-sprite-like pose readability.
- Cute creature silhouettes with strong outlines.

Avoid:

- Copying any Pokemon creature design.
- Using Pokeball-like symbols.
- Matching exact Pokemon UI panels.
- Naming species after Pokemon concepts.
- Reusing recognizable poses, colors, or markings from existing Pokemon.

The target is "retro collectible pixel pet," not "Pokemon clone."

## Chosen First Mascot

The first mascot should become an original pixel owl-monster.

Keep the owl identity because it already fits the product:

- It reads as smart and GitHub-friendly.
- It can evolve from egg to chick to owl.
- It has simple readable parts: round body, face disc, beak, feet.
- It works well at tiny sizes.

But the style should change:

- Use crisp pixel edges, not smooth vector curves.
- Use a 2x or 3x scaled sprite inside the SVG.
- Use a dark outline around the body.
- Use 4-8 main colors per sprite.
- Use tiny highlights only where they improve readability.
- Make the adult sprite feel like a game character, not a logo mascot.

## Sprite Size

Recommended first asset sizes:

| Asset | Native size | Display size | Notes |
|---|---:|---:|---|
| Egg | 32x32 | 96x96 | Simple face and cracks |
| Baby | 40x40 | 120x120 | Yellow chick, oversized eyes |
| Child | 48x48 | 144x144 | First clear owl shape |
| Teen | 56x56 | 168x168 | Stronger silhouette |
| Adult | 64x64 | 192x192 | Main README hero sprite |

Use `image-rendering: pixelated` when previewed in HTML. If the final README card embeds the sprite in SVG, preserve hard pixel edges by drawing rectangles or embedding a pixelated PNG.

## Mood Design

Do not overbuild every expression first.

Recommended first pass:

- Happy: default idle sprite for all 5 growth stages.
- Hungry: adult-only alternate sprite.
- Sick: adult-only alternate sprite.
- Ghost/neglect: one separate ghost-like pixel sprite.

After the base sprite feels good, expand moods to other stages.

Expression rules:

- Happy should feel alert and collectible.
- Hungry should feel needy, not ugly.
- Sick should feel weak, not creepy.
- Avoid complex mouth shapes at small sizes.
- Use eye shape, posture, sweat mark, and palette shift before adding detail.

## Card Layout Direction

The card should feel like a small game status panel.

Recommended changes:

- Put the pixel pet on the left as the main visual anchor.
- Keep a dark game-panel background.
- Use restrained UI text so the sprite carries the emotion.
- Consider a subtle pixel-grid or tile background only if it stays quiet.
- Keep the fullness bar clean and readable.
- Avoid glossy modern mascot-card styling.

The card should read as:

1. "This is my tiny game pet."
2. "This is its current state."
3. "My commits are feeding it."

## Rendering Notes

Implementation should preserve README reliability.

Options to test:

- Inline SVG made of `<rect>` pixels.
- Embedded base64 PNG inside `pet.svg`.
- Repo-local PNG referenced from `pet.svg`.
- Raw GitHub PNG referenced from `pet.svg`.

Prefer the approach that renders reliably in:

- GitHub README.
- Direct SVG view.
- Light and dark GitHub themes.
- Browser previews.

If external image references are unreliable, generate the sprite as inline SVG rectangles. The source asset can still be authored as pixel data.

## Art Quality Bar

Judge the next version by whether the sprite feels collectible.

A pass should satisfy:

- Adult sprite is recognizable at 64x64.
- Silhouette is readable without text.
- Pixel edges are crisp, not blurry.
- The sprite has enough charm without smooth gradients.
- Growth stages feel like one creature line.
- Happy adult sprite makes the user want to keep it in a profile.
- Hungry and sick states are expressive without becoming strange.

## Near-Term Plan

1. Freeze smooth vector mascot work.
2. Create one original pixel owl-monster line.
3. Start with 5 happy growth sprites plus adult hungry/sick.
4. Update the preview sheet to show native and scaled sizes.
5. Update `pet.svg` rendering to preserve pixel edges.
6. Only then revisit species variants.

## Product Taste Rule

When in doubt, optimize for collectible charm over illustration polish.

A tiny memorable sprite is better than a large awkward mascot.
