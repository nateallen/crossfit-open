// CrossFit Leaderboard API Response Types

export interface LeaderboardResponse {
  version: number;
  dataType: string;
  pagination: {
    totalPages: number;
    totalCompetitors: number;
    currentPage: number;
  };
  leaderboardRows: LeaderboardRow[];
  ordinals?: WorkoutOrdinal[];
}

export interface LeaderboardRow {
  overallRank: string;
  overallScore: string;
  nextStage?: string;
  ui?: {
    highlight: boolean;
    countryChampion: boolean;
  };
  entrant: Entrant;
  scores: WorkoutScore[];
}

export interface Entrant {
  competitorId: string;
  competitorName: string;
  firstName: string;
  lastName: string;
  status: string;
  gender: string;
  profilePicS3key?: string;
  countryOfOriginCode: string;
  countryOfOriginName: string;
  regionId: string;
  regionName: string;
  divisionId: string;
  affiliateId?: string;
  affiliateName?: string;
  age?: string;
  height?: string;
  weight?: string;
  teamCaptain?: boolean;
}

export interface WorkoutScore {
  ordinal: number;
  rank: string;
  score: string;
  scoreDisplay: string;
  scaled?: boolean;
  video?: boolean;
  breakdown?: string;
  time?: string;
}

export interface WorkoutOrdinal {
  ordinal: number;
  name: string;
  description?: string;
}

// Score Parser Types

export type ScoreType = "time" | "reps" | "rounds_reps" | "load";

/**
 * Hybrid workouts allow either time (finishers) or reps (capped).
 * Finishers are always ranked above capped athletes.
 */
export interface ParsedScore {
  isValid: boolean;
  error?: string;
  scoreType: ScoreType;
  scorePrimaryRaw: number;
  scorePrimaryDisplay: string;
  scoreSecondaryRaw?: number; // Tiebreak time in seconds (if applicable)
  scoreSecondaryDisplay?: string;
  isFinisher?: boolean; // For hybrid workouts: true = finished under cap
}

export interface TiebreakConfig {
  /** Rep count at which tiebreak time is recorded */
  atReps: number;
  /** Description of when tiebreak is recorded */
  description: string;
}

export interface WorkoutMetadata {
  ordinal: number;
  name: string;
  scoreType: ScoreType;
  /** For hybrid workouts, the score type if athlete is capped */
  cappedScoreType?: ScoreType;
  timeCapSeconds?: number;
  /** Total reps possible in workout (for hybrid workouts) */
  totalReps?: number;
  repsPerRound?: number;
  sortDirection: "asc" | "desc";
  /** Tiebreak configuration (if workout has tiebreaks) */
  tiebreak?: TiebreakConfig;
  /** Short description of the workout */
  description?: string;
  /** Full detailed workout description from scorecard */
  detailedDescription?: string;
  /** Path to official scorecard PDF */
  scorecardPdf?: string;
}

// Division mapping
export const DIVISIONS = {
  MEN: 1,
  WOMEN: 2,
  MEN_45_49: 14,
  WOMEN_45_49: 15,
  MEN_50_54: 16,
  WOMEN_50_54: 17,
  MEN_35_39: 18,
  WOMEN_35_39: 19,
  MEN_40_44: 12,
  WOMEN_40_44: 13,
  MEN_55_59: 20,
  WOMEN_55_59: 21,
  MEN_60_PLUS: 22,
  WOMEN_60_PLUS: 23,
  MEN_65_PLUS: 24,
  WOMEN_65_PLUS: 25,
} as const;

export type DivisionId = (typeof DIVISIONS)[keyof typeof DIVISIONS];

// Simulator State Types

export interface SimulatorState {
  year: number;
  division: DivisionId;
  scores: Record<number, UserScore>; // keyed by workout ordinal
}

export interface UserScore {
  input: string;
  parsed: ParsedScore | null;
  percentile: number | null;
  estimatedRank: number | null;
  tiebreak?: string; // Optional tiebreak time (e.g., "8:41")
}

export interface SimulatorResults {
  overallPercentile: number | null;
  estimatedRank: number | null;
  totalPoints: number | null;
  workoutsEntered: number;
  totalWorkouts: number;
}
