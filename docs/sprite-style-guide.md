# Sprite Style Guide

How to generate new character sheets that match Yuki's look, so every creature feels like
part of one world.

**Core rule:** keep the *rendering technique, proportions, background, and finish* fixed.
Only swap the *palette, theme, and signature charm* per creature.

---

## 1. Style block (fixed — use for every character)

```
High-detail pixel-art creature sprite, retro 16/32-bit RPG monster-collector style.
Chibi proportions: oversized round head, large glossy eyes with small white highlight
dots, tiny rounded body, short stubby limbs. Soft volumetric cel-shading with a gentle
top-left light source, subtle ambient occlusion, soft rim light, faint outer glow. Clean
bold silhouette, cohesive limited palette, crisp readable pixels. Single character,
centered, front-facing at a slight 3/4 angle, friendly idle pose. Flat solid dark navy
background (#141323), no scenery, only a small soft contact shadow. Cute, wholesome,
cohesive line weight and rendering. Keep proportions and finish identical across the set.
```

## 2. Subject line (swap this per character)

```
# Reference — Yuki (snow theme)
Subject: a snowy owl. Palette: snowy whites, sky-blue, lavender shadows, amber beak/feet.
Signature charm: a small blue snowflake pendant.

# Dragon (fire theme)
Subject: a baby fire dragon. Palette: warm coral/orange body, cream belly, ember-yellow
accents; tiny rounded horns, little flame puff. Signature charm: a small glowing ember gem.

# Penguin (ice theme)
Subject: a round baby penguin. Palette: deep blue-black back, white belly, amber beak and
feet, icy-blue highlights. Signature charm: a tiny knitted scarf.
```

Each new creature gets its own theme color + one signature charm; everything else stays as
the style block above.

## 3. Sheet layout

Every stage except `egg` needs **happy / hungry / sick** moods, so plan for two sheets.

**Sheet 1 — growth + adult moods + ghost**

```
Clean grid on the same navy background, evenly spaced, each character centered, scale
stepping up by life stage:

Growth row:  egg (speckled, tiny cute face) | baby happy (tiny & fluffy) |
             child happy (small) | teen happy (bigger) |
             adult happy (full, wearing the signature charm, closed eyes + sparkles)
Mood row:    adult hungry (droopy, sweat drop) | adult sick (unwell, ice pack on head) |
             ghost (glowing translucent version)
```

**Sheet 2 — baby / child / teen mood variants** (same style block, same palette)

```
A 3x2 grid, scale stepping up by stage:

Hungry row:  baby hungry | child hungry | teen hungry   (droopy eyes, small sweat drop)
Sick row:    baby sick   | child sick   | teen sick     (unwell, ice pack on head)
```

Keep style, palette, outline weight, and lighting identical across both sheets.

## 4. Negative prompt

```
realistic, 3D render, photo, blurry, smooth gradient airbrush, extra limbs, text,
watermark, busy background, scenery, harsh outline, inconsistent scale, off-model.
```

## 5. Consistency tips

- **Attach the existing Yuki sheet as a reference image** and say "match this exact art
  style / proportions / background, new creature: …". This beats text alone for series
  consistency.
- **Lock the seed** and keep the same background color (#141323) across characters.
- **Generate large, then downscale:** ~1024px per cell (or a ~3072² sheet), then downscale
  to ~192px and optimize with `pngquant` / `oxipng` to produce the `@3x` runtime assets.
- Grab a **transparent-background** version too where possible, for flexible compositing.

## 6. From sheet to assets

1. Slice each cell into its own PNG.
2. Name to match the sprite map in `src/sprites.ts`. Full set per creature (14 files):

   - [ ] `egg.png`
   - [ ] `baby.png` · `baby-hungry.png` · `baby-sick.png`
   - [ ] `child.png` · `child-hungry.png` · `child-sick.png`
   - [ ] `teen.png` · `teen-hungry.png` · `teen-sick.png`
   - [ ] `adult-happy.png` · `adult-hungry.png` · `adult-sick.png`
   - [ ] `ghost.png`

   (`egg` has no mood variants; the adult default is `adult-happy`. `baby.png` /
   `child.png` / `teen.png` are the happy/default mood for those stages.)
3. Produce the optimized `@3x` variants (~192px) — those are what the renderer embeds.
4. Drop them under `assets/sprites/<creature>/`.
5. Keep the full-resolution masters and source sheets under `assets/source/` (gitignored).
