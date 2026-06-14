import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { DayInfo, Mood, PetState } from "./types";

const STATE_PATH = "pet-state.json";

const DAY_MS = 86_400_000;

/** Tuning knobs for the MVP economy. */
const FEED_PER_CONTRIB = 12; // fullness gained per new contribution
const DECAY_PER_DAY = 22; // fullness lost per day with no feeding
const START_FULLNESS = 60;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function loadState(now: Date): PetState {
  if (existsSync(STATE_PATH)) {
    return JSON.parse(readFileSync(STATE_PATH, "utf8")) as PetState;
  }
  const iso = now.toISOString();
  return {
    name: "Commitchi",
    species: "owl",
    bornAt: iso,
    lastTickAt: iso,
    fullness: START_FULLNESS,
    mood: "happy",
    ageDays: 0,
    lastDayDate: "",
    lastDayCounted: 0,
  };
}

export function saveState(state: PetState): void {
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + "\n");
}

function moodFor(fullness: number, daysSinceLastContribution: number): Mood {
  if (daysSinceLastContribution >= 3 || fullness <= 15) return "sick";
  if (fullness <= 45) return "hungry";
  return "happy";
}

/** Advance the pet one tick: decay over elapsed time, then feed on new contributions. */
export function applyTick(state: PetState, day: DayInfo, now: Date): PetState {
  const elapsedDays = (now.getTime() - new Date(state.lastTickAt).getTime()) / DAY_MS;

  let fullness = state.fullness - DECAY_PER_DAY * Math.max(0, elapsedDays);

  // Feed only on contributions we haven't already counted (handles multiple ticks/day).
  const newContribs =
    day.todayDate !== state.lastDayDate
      ? day.todayCount
      : Math.max(0, day.todayCount - state.lastDayCounted);

  fullness = clamp(fullness + newContribs * FEED_PER_CONTRIB, 0, 100);

  return {
    ...state,
    fullness: Math.round(fullness),
    mood: moodFor(fullness, day.daysSinceLastContribution),
    ageDays: Math.floor((now.getTime() - new Date(state.bornAt).getTime()) / DAY_MS),
    lastDayDate: day.todayDate,
    lastDayCounted: day.todayCount,
    lastTickAt: now.toISOString(),
  };
}
