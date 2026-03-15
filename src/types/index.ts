declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

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
  /** YouTube URL for workout announcement video */
  announcementVideo?: string | null;
  /** Athlete who won the workout in the announcement video */
  announcementWinner?: string;
  /** Athletes who competed in the announcement throwdown */
  announcementMatchup?: string;
}

// Division mapping
export const DIVISIONS = {
  MEN: 1,
  WOMEN: 2,
  MEN_45_49: 3,
  WOMEN_45_49: 4,
  MEN_50_54: 5,
  WOMEN_50_54: 6,
  MEN_55_59: 7,
  WOMEN_55_59: 8,
  MEN_40_44: 12,
  WOMEN_40_44: 13,
  BOYS_14_15: 14,
  GIRLS_14_15: 15,
  BOYS_16_17: 16,
  GIRLS_16_17: 17,
  MEN_35_39: 18,
  WOMEN_35_39: 19,
  MEN_60_64: 36,
  WOMEN_60_64: 37,
  MEN_65_69: 40,
  WOMEN_65_69: 41,
  MEN_70_PLUS: 42,
  WOMEN_70_PLUS: 43,
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
  scaled?: number; // 0=RX, 1=Scaled, 2=Foundations
}

export interface SimulatorResults {
  overallPercentile: number | null;
  estimatedRank: number | null;
  totalPoints: number | null;
  workoutsEntered: number;
  totalWorkouts: number;
}
