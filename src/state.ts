import { readFileSync, writeFileSync, existsSync } from "node:fs";
import {
  Activity,
  CelebrationMoment,
  CommitchiConfig,
  Mood,
  PetState,
  Stage,
  VisitorAction,
  VisitorInteractionRecord,
} from "./types";
import { resolveEvolution } from "./evolution";
import { getStrings, Strings } from "./i18n";

const STATE_PATH = "pet-state.json";

const DAY_MS = 86_400_000;
const STREAK_MILESTONES = [7, 30, 100];

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export const VISITOR_ACTION_BONUS: Record<
  VisitorAction,
  { fullness: number; happiness: number; stamina: number }
> = {
  feed: { fullness: 18, happiness: 4, stamina: 0 },
  play: { fullness: 3, happiness: 16, stamina: 3 },
};

function normalizeStat(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.round(clamp(value, 0, 100))
    : fallback;
}

function normalizeMilestones(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string"))];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeVisitorInteractions(value: unknown): Record<string, VisitorInteractionRecord> {
  if (!isRecord(value)) return {};

  const result: Record<string, VisitorInteractionRecord> = {};
  for (const [rawKey, rawRecord] of Object.entries(value)) {
    if (!isRecord(rawRecord)) continue;

    const key = rawKey.trim().toLowerCase();
    const lastInteractionDate = rawRecord.lastInteractionDate;
    if (!key || typeof lastInteractionDate !== "string") continue;

    result[key] = {
      lastInteractionDate,
      totalInteractions:
        typeof rawRecord.totalInteractions === "number" && Number.isFinite(rawRecord.totalInteractions)
          ? Math.max(0, Math.floor(rawRecord.totalInteractions))
          : 1,
      feedCount:
        typeof rawRecord.feedCount === "number" && Number.isFinite(rawRecord.feedCount)
          ? Math.max(0, Math.floor(rawRecord.feedCount))
          : 0,
      playCount:
        typeof rawRecord.playCount === "number" && Number.isFinite(rawRecord.playCount)
          ? Math.max(0, Math.floor(rawRecord.playCount))
          : 0,
    };
  }

  return result;
}

export function loadState(now: Date, config: CommitchiConfig): PetState {
  if (existsSync(STATE_PATH)) {
    const state = JSON.parse(readFileSync(STATE_PATH, "utf8")) as PetState;
    return {
      ...state,
      name: config.petName,
      fullness: normalizeStat(state.fullness, config.economy.startFullness),
      happiness: normalizeStat(state.happiness, config.economy.startFullness),
      stamina: normalizeStat(state.stamina, config.economy.startFullness),
      celebration: null,
      celebratedMilestones: normalizeMilestones(state.celebratedMilestones),
      visitorInteractions: normalizeVisitorInteractions(state.visitorInteractions),
    };
  }
  const iso = now.toISOString();
  return {
    name: config.petName,
    species: "yuki",
    lockedSpecies: "",
    stage: "egg",
    bornAt: iso,
    lastTickAt: iso,
    fullness: config.economy.startFullness,
    happiness: config.economy.startFullness,
    stamina: config.economy.startFullness,
    mood: "happy",
    celebration: null,
    celebratedMilestones: [],
    ageDays: 0,
    lastDayDate: "",
    lastDayCounted: 0,
    visitorInteractions: {},
  };
}

export function saveState(state: PetState): void {
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + "\n");
}

function moodFor(
  fullness: number,
  happiness: number,
  stamina: number,
  daysSinceLastContribution: number,
  config: CommitchiConfig
): Mood {
  const lowestStat = Math.min(fullness, happiness, stamina);
  if (
    daysSinceLastContribution >= config.thresholds.neglectDays ||
    lowestStat <= config.thresholds.sickFullness
  ) {
    return "sick";
  }
  if (lowestStat <= config.thresholds.hungryFullness) return "hungry";
  return "happy";
}

function evolutionCelebration(stage: Stage, s: Strings): CelebrationMoment | null {
  if (stage === "egg") return null;
  const { title, detail } = s.evolutionCelebration(s.stage[stage]);
  return {
    kind: "evolution",
    milestoneId: `evolution:${stage}`,
    title,
    detail,
  };
}

function streakCelebration(streak: number, seen: Set<string>, s: Strings): CelebrationMoment | null {
  const newest = [...STREAK_MILESTONES]
    .reverse()
    .find((days) => streak >= days && !seen.has(`streak:${days}`));

  if (!newest) return null;

  const { title, detail } = s.streakCelebration(newest);
  return {
    kind: "streak",
    milestoneId: `streak:${newest}`,
    title,
    detail,
  };
}

function resolveCelebration(
  previous: PetState,
  nextStage: Stage,
  streak: number,
  s: Strings
): { celebration: CelebrationMoment | null; celebratedMilestones: string[] } {
  const seen = new Set(previous.celebratedMilestones);

  if (previous.stage !== nextStage) {
    const celebration = evolutionCelebration(nextStage, s);
    if (celebration && !seen.has(celebration.milestoneId)) {
      seen.add(celebration.milestoneId);
      return { celebration, celebratedMilestones: [...seen] };
    }
  }

  const celebration = streakCelebration(streak, seen, s);
  if (celebration) {
    const days = Number(celebration.milestoneId.split(":")[1]);
    for (const milestone of STREAK_MILESTONES) {
      if (milestone <= days) seen.add(`streak:${milestone}`);
    }
    return { celebration, celebratedMilestones: [...seen] };
  }

  return { celebration: null, celebratedMilestones: [...seen] };
}

function stableIndex(seed: string, length: number): number {
  let hash = 0;
  for (const ch of seed) {
    hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  }
  return hash % length;
}

function visitorCelebration(
  action: VisitorAction,
  actor: string,
  today: string,
  s: Strings
): CelebrationMoment {
  const titles = s.visitorReactionTitles[action];
  const title = titles[stableIndex(`${action}:${actor}:${today}`, titles.length)];
  const bonus =
    action === "feed" ? VISITOR_ACTION_BONUS.feed.fullness : VISITOR_ACTION_BONUS.play.happiness;
  const detail = s.visitorCelebrationDetail(action, actor, bonus);

  return {
    kind: "visitor",
    milestoneId: `visitor:${action}:${today}:${actor}`,
    title,
    detail,
  };
}

/**
 * Decay stats by the time elapsed since the last tick. Returns the (unclamped)
 * decayed values so callers can add their own gains before clamping. Shared by
 * applyTick and visitor interactions so both advance state to `now` consistently.
 */
function decayStats(
  state: PetState,
  now: Date,
  config: CommitchiConfig
): { elapsedDays: number; fullness: number; happiness: number; stamina: number } {
  const elapsedDays = Math.max(0, (now.getTime() - new Date(state.lastTickAt).getTime()) / DAY_MS);
  return {
    elapsedDays,
    fullness: state.fullness - config.economy.decayPerDay * elapsedDays,
    happiness: state.happiness - config.economy.happinessDecayPerDay * elapsedDays,
    stamina: state.stamina - config.economy.staminaDecayPerDay * elapsedDays,
  };
}

/** Advance the pet one tick: feed, decay, age, and evolve. Returns the new state. */
export function applyTick(
  state: PetState,
  a: Activity,
  now: Date,
  config: CommitchiConfig
): PetState {
  const decayed = decayStats(state, now, config);

  // Feed only on contributions we haven't already counted (handles multiple ticks/day).
  const newContribs =
    a.todayDate !== state.lastDayDate
      ? a.todayCount
      : Math.max(0, a.todayCount - state.lastDayCounted);

  const fullness = clamp(decayed.fullness + newContribs * config.economy.feedPerContrib, 0, 100);

  const happinessGain = newContribs > 0 ? newContribs * (2 + a.collabRatio * 6) : 0;
  const happiness = clamp(decayed.happiness + happinessGain, 0, 100);

  const consistencyGain =
    newContribs > 0 ? 8 + Math.min(18, Math.max(0, a.streak) * 2) : 0;
  const burstPenalty = Math.max(0, newContribs - 6) * 2;
  const stamina = clamp(
    decayed.stamina + consistencyGain - burstPenalty,
    0,
    100
  );

  const ageDays = Math.floor((now.getTime() - new Date(state.bornAt).getTime()) / DAY_MS);
  const evo = resolveEvolution(a, ageDays, state.lockedSpecies, config.thresholds.neglectDays);
  const celebration =
    evo.species === "ghost"
      ? { celebration: null, celebratedMilestones: state.celebratedMilestones }
      : resolveCelebration(state, evo.stage, a.streak, getStrings(config.language));

  return {
    ...state,
    name: config.petName,
    fullness: Math.round(fullness),
    happiness: Math.round(happiness),
    stamina: Math.round(stamina),
    mood: moodFor(fullness, happiness, stamina, a.daysSinceLastContribution, config),
    celebration: celebration.celebration,
    celebratedMilestones: celebration.celebratedMilestones,
    ageDays,
    stage: evo.stage,
    species: evo.species,
    lockedSpecies: evo.lockedSpecies,
    lastDayDate: a.todayDate,
    lastDayCounted: a.todayCount,
    lastTickAt: now.toISOString(),
  };
}

export interface VisitorInteractionUpdate {
  state: PetState;
  applied: boolean;
  reason: "applied" | "rate_limited";
  action: VisitorAction;
  actor: string;
}

function moodAfterVisitorInteraction(
  state: PetState,
  fullness: number,
  happiness: number,
  stamina: number,
  config: CommitchiConfig
): Mood {
  if (state.species === "ghost") return "sick";
  return moodFor(fullness, happiness, stamina, 0, config);
}

/** Apply a visitor issue-op action. Visitors may help at most once per UTC day. */
export function applyVisitorInteraction(
  state: PetState,
  action: VisitorAction,
  actor: string,
  now: Date,
  config: CommitchiConfig
): VisitorInteractionUpdate {
  const actorKey = actor.trim().toLowerCase();
  if (!actorKey) throw new Error("Visitor interaction requires a GitHub actor.");

  const today = now.toISOString().slice(0, 10);
  const previous = state.visitorInteractions[actorKey];
  if (previous?.lastInteractionDate === today) {
    return { state, applied: false, reason: "rate_limited", action, actor: actorKey };
  }

  const bonus = VISITOR_ACTION_BONUS[action];
  // Decay elapsed time first so a visit can't erase pending hunger/happiness/stamina loss.
  const decayed = decayStats(state, now, config);
  const fullness = clamp(decayed.fullness + bonus.fullness, 0, 100);
  const happiness = clamp(decayed.happiness + bonus.happiness, 0, 100);
  const stamina = clamp(decayed.stamina + bonus.stamina, 0, 100);
  const visitorInteractions = {
    ...state.visitorInteractions,
    [actorKey]: {
      lastInteractionDate: today,
      totalInteractions: (previous?.totalInteractions ?? 0) + 1,
      feedCount: (previous?.feedCount ?? 0) + (action === "feed" ? 1 : 0),
      playCount: (previous?.playCount ?? 0) + (action === "play" ? 1 : 0),
    },
  };

  return {
    state: {
      ...state,
      name: config.petName,
      fullness: Math.round(fullness),
      happiness: Math.round(happiness),
      stamina: Math.round(stamina),
      mood: moodAfterVisitorInteraction(state, fullness, happiness, stamina, config),
      celebration: visitorCelebration(action, actorKey, today, getStrings(config.language)),
      visitorInteractions,
      lastTickAt: now.toISOString(),
    },
    applied: true,
    reason: "applied",
    action,
    actor: actorKey,
  };
}
