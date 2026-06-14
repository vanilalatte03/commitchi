# ADR 0001: Pixel-Art Pet Sprites

## Status

Accepted

## Context

Commitchi started as a generated SVG pet card for a GitHub README. The first vector
characters proved the feature but looked like assembled SVG primitives rather than a pet
people want to keep on a profile. The goal is a small game loop — commits feed a pet that
grows and changes — so the character art needs real charm.

## Decision

Use original pixel-art pet sprites as the character art. The generated README card stays
SVG (text, status bars, dates, and GitHub rendering need to stay dynamic), and the
character is a crafted pixel sprite embedded into that SVG.

The first (and currently only) creature is **Yuki**, a snowy owl, with a **Yurei** ghost
variant for neglect. The provided Yuki sprites are treated as original project art.

## Sprite set

- Growth stages: egg, baby, child, teen, adult.
- Mood variants (happy / hungry / sick) per stage, plus a Yurei ghost variant for neglect.
- Adult displays ~140–160px in the README card (sprites are ~192px source).

## Rendering

- Store PNG sprites under `assets/sprites/yuki/`.
- Embed the selected PNG into `pet.svg` as a base64 data URI.
- Use SVG for the card frame, labels, progress bars, and small effects.

Relative or external image references inside an SVG don't survive GitHub's image proxy, so
a self-contained (base64) SVG is what renders reliably.

## Consequences

- Stronger charm and better readability at README scale than procedural vector mascots.
- Requires authored sprite assets per stage/mood, and embedded PNGs increase SVG size.
- Multi-species expansion stays frozen until the single Yuki line feels good.
