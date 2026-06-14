# ADR 0002: Stage Mood Sprite Variants

## Status

Accepted

## Context

Yuki initially used unique mood sprites only for the adult stage. Baby, child, and teen reused the same happy growth sprite for `hungry` and `sick`, which made the card text say the pet was hungry or sick while the character still looked happy.

That weakens the virtual-pet loop. Users should be able to understand the pet's state from the sprite before reading the labels.

## Decision

Yuki will use separate mood sprites for:

- Baby hungry.
- Baby sick.
- Child hungry.
- Child sick.
- Teen hungry.
- Teen sick.
- Adult happy.
- Adult hungry.
- Adult sick.
- Ghost.

Egg mood variants are deferred. The egg can keep a neutral/default sprite until we decide whether egg state should be shown through cracks, color, shaking, frost, or no visual change at all.

## Asset Handling

Use the user-provided sprite sheets as source art.

For implementation:

- Crop source sprites directly from the provided sheets.
- Do not redraw, repaint, erase background, or reinterpret sprite pixels.
- Do not downsample to a hand-made low-resolution version.
- Let the card render the cropped PNG asset.

Cropping is allowed only to isolate the supplied sprite panel from the sheet.

## Consequences

Positive:

- The card state becomes readable without relying only on text.
- Baby, child, and teen stages feel more alive.
- Future creatures should follow the same growth-stage mood coverage.

Tradeoffs:

- More assets per creature line.
- The egg state remains less expressive for now.
- Source crops may include their original dark panel background, so the card background should remain visually compatible.
