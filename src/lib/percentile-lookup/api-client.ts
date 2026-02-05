/**
 * CrossFit Leaderboard API client for the anchor-based percentile lookup.
 *
 * Handles fetching leaderboard pages with caching and rate limiting.
 */

import type { WorkoutMetadata } from "@/types";
import type {
  LookupConfig,
  LookupCache,
  PageData,
  PageRow,
  LeaderboardAPIResponse,
} from "./types";
import { normalizeApiScore } from "./normalize";
import { getWorkoutMetadata } from "@/lib/workout-metadata";

const CROSSFIT_API_BASE =
  "https://c3po.crossfit.com/api/leaderboards/v2/competitions/open";

// Default page size from CrossFit API
const DEFAULT_PAGE_SIZE = 50;

/**
 * Create a new lookup cache instance.
 */
export function createCache(config: LookupConfig): LookupCache {
  return {
    config,
    totalCompetitors: 0,
    totalPages: 0,
    pageSize: DEFAULT_PAGE_SIZE,
    anchors: [],
    pages: new Map(),
    createdAt: Date.now(),
  };
}

/**
 * Fetch a leaderboard page from the CrossFit API.
 * Uses cache if available.
 */
export async function fetchLeaderboardPage(
  config: LookupConfig,
  page: number,
  cache: LookupCache
): Promise<PageData> {
  // Check cache first
  const cached = cache.pages.get(page);
  if (cached) {
    return cached;
  }

  // Build API URL
  const url = new URL(`${CROSSFIT_API_BASE}/${config.year}/leaderboards`);
  url.searchParams.set("view", "0");
  url.searchParams.set("division", config.division.toString());
  url.searchParams.set("scaled", config.scaled.toString());
  url.searchParams.set("page", page.toString());
  url.searchParams.set("region", "0");
  // Sort by the specific workout (0=overall, 1=workout1, 2=workout2, etc.)
  url.searchParams.set("sort", config.workoutOrdinal.toString());

  // Fetch from API
  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`CrossFit API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as LeaderboardAPIResponse;

  // Update cache metadata from pagination
  if (page === 1) {
    cache.totalCompetitors = data.pagination.totalCompetitors;
    cache.totalPages = data.pagination.totalPages;
    cache.pageSize = data.leaderboardRows.length || DEFAULT_PAGE_SIZE;
  }

  // Get workout metadata for score normalization
  const workout = getWorkoutMetadata(config.year, config.workoutOrdinal);
  if (!workout) {
    throw new Error(`No workout metadata for ${config.year} ordinal ${config.workoutOrdinal}`);
  }

  // Parse rows
  const rows = parseLeaderboardRows(data, config, workout);

  if (rows.length === 0) {
    throw new Error(`No scores found on page ${page} for workout ${config.workoutOrdinal}`);
  }

  const pageData: PageData = {
    page,
    rows,
    firstRank: rows[0].rank,
    lastRank: rows[rows.length - 1].rank,
    firstScore: rows[0].scoreNormalized,
    lastScore: rows[rows.length - 1].scoreNormalized,
    fetchedAt: Date.now(),
  };

  // Store in cache
  cache.pages.set(page, pageData);

  return pageData;
}

/**
 * Parse tiebreak time from breakdown string.
 * Returns time in seconds, or undefined if no tiebreak found.
 */
function parseTiebreakFromBreakdown(breakdown?: string): number | undefined {
  if (!breakdown) return undefined;

  // Look for "Tiebreak: X:XX" or "Tiebreak: XX:XX" pattern
  const match = breakdown.match(/Tiebreak:\s*(\d+):(\d{2})/i);
  if (!match) return undefined;

  const minutes = parseInt(match[1], 10);
  const seconds = parseInt(match[2], 10);

  if (isNaN(minutes) || isNaN(seconds)) return undefined;

  return minutes * 60 + seconds;
}

/**
 * Parse leaderboard rows from API response.
 */
function parseLeaderboardRows(
  data: LeaderboardAPIResponse,
  config: LookupConfig,
  workout: WorkoutMetadata
): PageRow[] {
  const rows: PageRow[] = [];

  for (const row of data.leaderboardRows) {
    // Find the score for the requested workout ordinal
    const scoreEntry = row.scores.find(
      (s) => s.ordinal === config.workoutOrdinal
    );

    if (!scoreEntry || !scoreEntry.scoreDisplay) {
      continue; // Skip athletes without a score for this workout
    }

    // Parse the rank
    const rank = scoreEntry.rank ? parseInt(scoreEntry.rank, 10) : null;
    if (rank === null || isNaN(rank)) {
      continue;
    }

    // Normalize the score
    const normalized = normalizeApiScore(scoreEntry.scoreDisplay, workout);
    if (!normalized) {
      continue;
    }

    // Parse tiebreak if available
    const tiebreakSeconds = parseTiebreakFromBreakdown(scoreEntry.breakdown);

    rows.push({
      rank,
      scoreDisplay: scoreEntry.scoreDisplay,
      scoreNormalized: normalized.raw,
      athleteId: row.entrant.competitorId,
      tiebreakSeconds,
    });
  }

  // Sort by rank (should already be sorted, but ensure)
  rows.sort((a, b) => a.rank - b.rank);

  return rows;
}

/**
 * Calculate which page contains a target rank.
 */
export function rankToPage(rank: number, pageSize: number): number {
  return Math.ceil(rank / pageSize);
}

/**
 * Calculate the approximate rank for a percentile.
 */
export function percentileToRank(
  percentile: number,
  totalCompetitors: number
): number {
  return Math.max(1, Math.ceil((percentile / 100) * totalCompetitors));
}

/**
 * Initialize cache by fetching page 1.
 * This gets us totalCompetitors and totalPages.
 */
export async function initializeCache(
  config: LookupConfig,
  cache: LookupCache
): Promise<void> {
  await fetchLeaderboardPage(config, 1, cache);
}

/**
 * Get total API calls made (for debugging).
 */
export function getApiCallCount(cache: LookupCache): number {
  return cache.pages.size;
}
