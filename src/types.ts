export type Mood = "happy" | "hungry" | "sick";

/** The pet's persistent memory. Lives in pet-state.json, accumulates across ticks. */
export interface PetState {
  name: string;
  species: string;
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

/** A snapshot of the user's recent GitHub activity, distilled to what the pet cares about. */
export interface DayInfo {
  /** Most recent day in the contribution calendar (YYYY-MM-DD). */
  todayDate: string;
  /** Contribution count on todayDate. */
  todayCount: number;
  /** Whole days since the most recent day that had any contributions. 0 = committed today. */
  daysSinceLastContribution: number;
  /** Total contributions in the trailing year (for flavor / future levels). */
  totalThisYear: number;
}
