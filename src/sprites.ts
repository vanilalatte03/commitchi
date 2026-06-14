import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Mood, Species, Stage } from "./types";

export const DEFAULT_SPECIES: Species = "yuki";

export const SPECIES_LABEL: Record<Species, string> = {
  yuki: "Yuki",
  ghost: "Yurei",
};

export const STAGE_LABEL: Record<Stage, string> = {
  egg: "Egg",
  baby: "Baby",
  child: "Child",
  teen: "Teen",
  adult: "Adult",
};

interface SpriteSpec {
  file: string;
  /** Render width/height in the card, in SVG units. */
  displaySize: number;
}

export interface SpriteAsset extends SpriteSpec {
  href: string;
}

const SPRITE_DIR = join(process.cwd(), "assets", "sprites", "yuki");

// We embed the "@3x" variants: ~192px, display-optimized PNGs (~8-10KB each).
// They are crisp at our ~158px display size and keep pet.svg ~20x smaller than
// the full-resolution source sprites.
const VARIANT_SUFFIX = "@3x";

const STAGE_SPRITES: Record<Stage, SpriteSpec> = {
  egg: { file: "egg.png", displaySize: 96 },
  baby: { file: "baby.png", displaySize: 118 },
  child: { file: "child.png", displaySize: 136 },
  teen: { file: "teen.png", displaySize: 150 },
  adult: { file: "adult.png", displaySize: 158 },
};

const ADULT_MOOD_SPRITES: Record<Mood, SpriteSpec> = {
  happy: { file: "adult-happy.png", displaySize: 158 },
  hungry: { file: "adult-hungry.png", displaySize: 158 },
  sick: { file: "adult-sick.png", displaySize: 158 },
};

const STAGE_MOOD_SPRITES: Partial<Record<Stage, Partial<Record<Mood, SpriteSpec>>>> = {
  baby: {
    hungry: { file: "baby-hungry.png", displaySize: 126 },
    sick: { file: "baby-sick.png", displaySize: 126 },
  },
  child: {
    hungry: { file: "child-hungry.png", displaySize: 142 },
    sick: { file: "child-sick.png", displaySize: 142 },
  },
  teen: {
    hungry: { file: "teen-hungry.png", displaySize: 154 },
    sick: { file: "teen-sick.png", displaySize: 154 },
  },
};

const GHOST_SPRITE: SpriteSpec = { file: "ghost.png", displaySize: 158 };

const dataUriCache = new Map<string, string>();

function variantFile(file: string): string {
  return file.replace(/\.png$/, `${VARIANT_SUFFIX}.png`);
}

function spriteDataUri(file: string): string {
  const cached = dataUriCache.get(file);
  if (cached) return cached;

  const path = join(SPRITE_DIR, variantFile(file));
  if (!existsSync(path)) {
    throw new Error(`Missing sprite asset: ${path}`);
  }

  const encoded = readFileSync(path).toString("base64");
  const href = `data:image/png;base64,${encoded}`;
  dataUriCache.set(file, href);
  return href;
}

export function spriteFor(stage: Stage, species: Species, mood: Mood): SpriteAsset {
  const spec =
    species === "ghost" && stage !== "egg"
      ? GHOST_SPRITE
      : stage === "adult"
        ? ADULT_MOOD_SPRITES[mood]
        : STAGE_MOOD_SPRITES[stage]?.[mood] ?? STAGE_SPRITES[stage];

  return {
    ...spec,
    href: spriteDataUri(spec.file),
  };
}
