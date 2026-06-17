import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DEFAULT_CONFIG } from "../src/config";
import type {
  Activity,
  CommitchiConfig,
  DexEntry,
  EconomyConfig,
  Language,
  PetState,
  SaveState,
  Species,
  Theme,
  ThresholdConfig,
} from "../src/types";

interface ConfigOverrides {
  petName?: string;
  character?: Species;
  displayStage?: CommitchiConfig["displayStage"];
  language?: Language;
  theme?: Theme;
  economy?: Partial<EconomyConfig>;
  thresholds?: Partial<ThresholdConfig>;
}

export function makeConfig(overrides: ConfigOverrides = {}): CommitchiConfig {
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    economy: {
      ...DEFAULT_CONFIG.economy,
      ...overrides.economy,
    },
    thresholds: {
      ...DEFAULT_CONFIG.thresholds,
      ...overrides.thresholds,
    },
  };
}

export function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    todayDate: "2026-01-15",
    todayCount: 0,
    totalThisYear: 0,
    daysSinceLastContribution: 0,
    streak: 0,
    weekendRatio: 0,
    collabRatio: 0,
    languageCount: 1,
    ...overrides,
  };
}

export function makeState(
  overrides: Partial<PetState> = {},
  config = makeConfig()
): PetState {
  const iso = "2026-01-15T00:00:00.000Z";
  return {
    name: config.petName,
    species: config.character,
    isGhost: false,
    lockedSpecies: "",
    stage: "egg",
    bornAt: iso,
    lastTickAt: iso,
    fullness: config.economy.startFullness,
    happiness: config.economy.startFullness,
    stamina: config.economy.startFullness,
    mood: "happy",
    note: { code: "content", days: 0, at: iso },
    log: [],
    celebration: null,
    celebratedMilestones: [],
    ageDays: 0,
    lastDayDate: "",
    lastDayCounted: 0,
    visitorInteractions: {},
    ...overrides,
  };
}

export function makeSave(
  overrides: Partial<SaveState> = {},
  config = makeConfig()
): SaveState {
  const active = overrides.active ?? config.character;
  const activeConfig = { ...config, character: active };
  const pets = overrides.pets ?? { [active]: makeState({}, activeConfig) };
  const dex =
    overrides.dex ??
    (Object.fromEntries(
      Object.entries(pets).map(([species, pet]) => [
        species,
        { firstSeenAt: pet.bornAt, maxStage: pet.stage },
      ])
    ) as Record<Species, DexEntry>);

  return {
    schemaVersion: 2,
    active,
    pets,
    dex,
  };
}

export function withTempDir<T>(fn: (dir: string) => T): T {
  const dir = mkdtempSync(join(tmpdir(), "commitchi-test-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export function writeJson(path: string, value: unknown): void {
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n", "utf8");
}

export function writeText(path: string, value: string): void {
  writeFileSync(path, value, "utf8");
}
