/**
 * Types for the anchor-based percentile lookup system.
 * This is a parallel/experimental approach to the existing full-sync system.
 */

export interface LookupConfig {
  year: number;
  division: number;
  scaled: number; // 0=RX, 1=Scaled, 2=Foundations
  workoutOrdinal: number;
  tiebreakSeconds?: number; // User's tiebreak time in seconds (optional)
}

export interface NormalizedScore {
  raw: number; // The normalized numeric value (lower = better rank)
  display: string; // Human-readable display
  isFinisher?: boolean; // For hybrid workouts
}

export interface PageData {
  page: number;
  rows: PageRow[];
  firstRank: number;
  lastRank: number;
  firstScore: number; // Normalized
  lastScore: number; // Normalized
  fetchedAt: number;
}

export interface PageRow {
  rank: number;
  scoreDisplay: string;
  scoreNormalized: number;
  athleteId?: string;
  tiebreakSeconds?: number; // Tiebreak time in seconds (lower = better)
}

export interface AnchorPoint {
  percentile: number;
  targetRank: number;
  page: number;
  pageData: PageData;
}

export interface LookupResult {
  success: boolean;
  percentile: number | null;
  percentileRange?: { best: number; worst: number };
  estimatedRank: number | null;
  rankRange?: { best: number; worst: number };
  totalCompetitors: number;
  matchType: "exact" | "bracket" | "edge" | "error";
  apiCallsMade: number;
  debug?: LookupDebug;
}

export interface LookupDebug {
  normalizedScore: number;
  anchorsUsed: number;
  pagesSearched: number[];
  bracketFound?: {
    lowPage: number;
    highPage: number;
  };
  matchDetails?: {
    page: number;
    matchingRanks?: number[];
    bracketAbove?: PageRow;
    bracketBelow?: PageRow;
  };
  error?: string;
}

export interface LeaderboardAPIResponse {
  pagination: {
    totalPages: number;
    totalCompetitors: number;
    currentPage: number;
  };
  leaderboardRows: LeaderboardRow[];
}

export interface LeaderboardRow {
  oderlankRank: string;
  entrant: {
    competitorId: string;
    competitorName: string;
  };
  scores: LeaderboardScore[];
}

export interface LeaderboardScore {
  ordinal: number;
  rank: string;
  score: string;
  scoreDisplay: string;
  scaled: number;
  breakdown?: string;
}

// Cache types
export interface LookupCache {
  config: LookupConfig;
  totalCompetitors: number;
  totalPages: number;
  pageSize: number;
  anchors: AnchorPoint[];
  pages: Map<number, PageData>;
  createdAt: number;
}
