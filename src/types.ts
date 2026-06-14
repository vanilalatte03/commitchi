export type Mood = "happy" | "hungry" | "sick";

export type Theme = "winter";

// Species expansion (dragon/chameleon/wolf/…) is parked while the default mascot
// gets polished. For now the world is just Yuki and its neglected ghost form.
export type Species = "yuki" | "ghost";

export type Stage = "egg" | "baby" | "child" | "teen" | "adult";

/** The pet's persistent memory. Lives in pet-state.json, accumulates across ticks. */
export interface PetState {
  name: string;
  /** Currently displayed species (may be "ghost" while neglected). */
  species: Species;
  /** Species frozen at adulthood. "" until the pet reaches the adult stage. */
  lockedSpecies: Species | "";
  stage: Stage;
  bornAt: string;
  lastTickAt: string;
  /** 0-100. Driven by commits, decays over time. */
  fullness: number;
  mood: Mood;
  ageDays: number;
  /** Date string (YYYY-MM-DD) of the day we last counted contributions for. */
  lastDayDate: string;
  /** How many contributions on lastDayDate we have already fed the pet. */
  lastDayCounted: number;
}

/** A snapshot of the user's GitHub activity: what the pet eats + how it evolves. */
export interface Activity {
  /** Most recent day in the contribution calendar (YYYY-MM-DD). */
  todayDate: string;
  /** Contribution count on todayDate. */
  todayCount: number;
  /** Total contributions in the trailing year. */
  totalThisYear: number;
  /** Whole days since the most recent day that had any contributions. 0 = today. */
  daysSinceLastContribution: number;
  /** Current consecutive-day contribution streak ending at the latest day. */
  streak: number;
  /** Fraction (0-1) of contributions that fall on Sat/Sun. */
  weekendRatio: number;
  /** Fraction (0-1) of work that is collaborative (PRs, reviews, issues). */
  collabRatio: number;
  /** Distinct primary languages across the user's repos. */
  languageCount: number;
}

export interface EconomyConfig {
  /** Fullness gained per new contribution. */
  feedPerContrib: number;
  /** Fullness lost per elapsed day. */
  decayPerDay: number;
  /** Fullness used when a pet is born without existing state. */
  startFullness: number;
}

export interface ThresholdConfig {
  /** At or below this fullness, the pet is hungry. */
  hungryFullness: number;
  /** At or below this fullness, or after neglectDays, the pet is sick. */
  sickFullness: number;
  /** Whole days without contributions before the pet becomes Yurei. */
  neglectDays: number;
}

export interface CommitchiConfig {
  name: string;
  theme: Theme;
  economy: EconomyConfig;
  thresholds: ThresholdConfig;
}
