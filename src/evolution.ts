import { Activity, Species, Stage } from "./types";
import { DEFAULT_SPECIES } from "./sprites";

/** Age in days at which each stage begins. */
const STAGE_THRESHOLDS: { stage: Stage; days: number }[] = [
  { stage: "egg", days: 0 },
  { stage: "baby", days: 1 },
  { stage: "child", days: 3 },
  { stage: "teen", days: 7 },
  { stage: "adult", days: 14 },
];

/** How neglected (days without a contribution) before the pet turns into a ghost. */
export const NEGLECT_DAYS = 4;

export function stageFor(ageDays: number): Stage {
  let result: Stage = "egg";
  for (const { stage, days } of STAGE_THRESHOLDS) {
    if (ageDays >= days) result = stage;
  }
  return result;
}

/** Whole days until the next stage, or null if already adult. */
export function daysToNextStage(ageDays: number): number | null {
  for (const { days } of STAGE_THRESHOLDS) {
    if (ageDays < days) return Math.ceil(days - ageDays);
  }
  return null;
}

/** Keep the first pass focused on one lovable default mascot. */
export function pickSpecies(a: Activity): Species {
  if (a.daysSinceLastContribution >= NEGLECT_DAYS) return "ghost";
  return DEFAULT_SPECIES;
}

export interface Evolution {
  stage: Stage;
  /** Species to display (may be "ghost" if currently neglected). */
  species: Species;
  /** Species frozen at adulthood; "" until then. */
  lockedSpecies: Species | "";
}

/**
 * Resolve the pet's stage + species for this tick.
 *
 * Rules:
 *  - Stage advances purely with age.
 *  - Species expansion is intentionally frozen while the default mascot gets polished.
 *  - A neglected pet shows as a resting ghost variant, then returns to the default mascot
 *    once the owner starts committing again.
 */
export function resolveEvolution(
  a: Activity,
  ageDays: number,
  prevLocked: Species | ""
): Evolution {
  const stage = stageFor(ageDays);
  const neglected = a.daysSinceLastContribution >= NEGLECT_DAYS;

  if (prevLocked) {
    return { stage, species: neglected ? "ghost" : DEFAULT_SPECIES, lockedSpecies: DEFAULT_SPECIES };
  }

  const candidate = pickSpecies(a);

  if (stage === "adult") {
    const locked: Species = candidate === "ghost" ? DEFAULT_SPECIES : candidate;
    return { stage, species: neglected ? "ghost" : locked, lockedSpecies: locked };
  }

  return { stage, species: candidate, lockedSpecies: "" };
}
