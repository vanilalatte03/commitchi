import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { Activity, CommitchiConfig, Mood, PetState } from "./types";
import { resolveEvolution } from "./evolution";

const STATE_PATH = "pet-state.json";

const DAY_MS = 86_400_000;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function loadState(now: Date, config: CommitchiConfig): PetState {
  if (existsSync(STATE_PATH)) {
    const state = JSON.parse(readFileSync(STATE_PATH, "utf8")) as PetState;
    return { ...state, name: config.name };
  }
  const iso = now.toISOString();
  return {
    name: config.name,
    species: "yuki",
    lockedSpecies: "",
    stage: "egg",
    bornAt: iso,
    lastTickAt: iso,
    fullness: config.economy.startFullness,
    mood: "happy",
    ageDays: 0,
    lastDayDate: "",
    lastDayCounted: 0,
  };
}

export function saveState(state: PetState): void {
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + "\n");
}

function moodFor(
  fullness: number,
  daysSinceLastContribution: number,
  config: CommitchiConfig
): Mood {
  if (
    daysSinceLastContribution >= config.thresholds.neglectDays ||
    fullness <= config.thresholds.sickFullness
  ) {
    return "sick";
  }
  if (fullness <= config.thresholds.hungryFullness) return "hungry";
  return "happy";
}

/** Advance the pet one tick: feed, decay, age, and evolve. Returns the new state. */
export function applyTick(
  state: PetState,
  a: Activity,
  now: Date,
  config: CommitchiConfig
): PetState {
  const elapsedDays = (now.getTime() - new Date(state.lastTickAt).getTime()) / DAY_MS;

  let fullness = state.fullness - config.economy.decayPerDay * Math.max(0, elapsedDays);

  // Feed only on contributions we haven't already counted (handles multiple ticks/day).
  const newContribs =
    a.todayDate !== state.lastDayDate
      ? a.todayCount
      : Math.max(0, a.todayCount - state.lastDayCounted);

  fullness = clamp(fullness + newContribs * config.economy.feedPerContrib, 0, 100);

  const ageDays = Math.floor((now.getTime() - new Date(state.bornAt).getTime()) / DAY_MS);
  const evo = resolveEvolution(a, ageDays, state.lockedSpecies, config.thresholds.neglectDays);

  return {
    ...state,
    name: config.name,
    fullness: Math.round(fullness),
    mood: moodFor(fullness, a.daysSinceLastContribution, config),
    ageDays,
    stage: evo.stage,
    species: evo.species,
    lockedSpecies: evo.lockedSpecies,
    lastDayDate: a.todayDate,
    lastDayCounted: a.todayCount,
    lastTickAt: now.toISOString(),
  };
}
