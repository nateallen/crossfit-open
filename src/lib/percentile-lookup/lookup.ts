/**
 * Main percentile lookup orchestration.
 *
 * This is the entry point for looking up a score's percentile.
 * It coordinates anchors, binary search, and percentile calculation.
 */

import type { WorkoutMetadata } from "@/types";
import type { LookupConfig, LookupCache, LookupResult, LookupDebug } from "./types";
import { createCache, getApiCallCount } from "./api-client";
import { normalizeUserScore } from "./normalize";
import { buildAnchorMap, findBracketFromAnchors } from "./anchors";
import {
  binarySearchForPage,
  findMatchOnPage,
  refineMatchWithAdjacentPages,
  findExactScoreCluster,
  interpolateRank,
} from "./search";

/**
 * Look up the percentile for a user's score.
 *
 * This is the main entry point for the anchor-based percentile lookup.
 */
export async function lookupPercentile(
  config: LookupConfig,
  userScore: string,
  workout: WorkoutMetadata
): Promise<LookupResult> {
  const debug: LookupDebug = {
    normalizedScore: 0,
    anchorsUsed: 0,
    pagesSearched: [],
  };

  try {
    // Create cache for this lookup
    const cache = createCache(config);

    // Normalize user's score
    const normalized = normalizeUserScore(userScore, workout);
    if (!normalized) {
      return {
        success: false,
        percentile: null,
        estimatedRank: null,
        totalCompetitors: 0,
        matchType: "error",
        apiCallsMade: 0,
        debug: { ...debug, error: "Failed to normalize score" },
      };
    }

    debug.normalizedScore = normalized.raw;

    // Build anchor map (samples strategic pages)
    const anchors = await buildAnchorMap(config, cache);
    debug.anchorsUsed = anchors.length;

    if (anchors.length === 0) {
      return {
        success: false,
        percentile: null,
        estimatedRank: null,
        totalCompetitors: cache.totalCompetitors,
        matchType: "error",
        apiCallsMade: getApiCallCount(cache),
        debug: { ...debug, error: "No anchors built" },
      };
    }

    // Find bracket from anchors
    const bracket = findBracketFromAnchors(normalized.raw, anchors);

    if (!bracket) {
      return {
        success: false,
        percentile: null,
        estimatedRank: null,
        totalCompetitors: cache.totalCompetitors,
        matchType: "error",
        apiCallsMade: getApiCallCount(cache),
        debug: { ...debug, error: "Could not find bracket from anchors" },
      };
    }

    debug.bracketFound = bracket;

    // Binary search to find exact page
    const searchResult = await binarySearchForPage(
      normalized.raw,
      bracket.lowPage,
      bracket.highPage,
      config,
      cache
    );

    debug.pagesSearched = searchResult.pagesSearched;

    // Find match on page
    let matchResult = findMatchOnPage(normalized.raw, searchResult.pageData);

    // Refine with adjacent pages if needed
    if (matchResult.matchType.startsWith("edge_")) {
      const refined = await refineMatchWithAdjacentPages(
        normalized.raw,
        searchResult.page,
        matchResult,
        config,
        cache
      );
      matchResult = refined.matchResult;
      debug.pagesSearched.push(...refined.additionalPages);
    }

    // Always scan for the full cluster to find all athletes with the same score
    // CrossFit uses "worst rank among ties" so we need to find the entire tie group
    if (matchResult.matchType === "bracket" || matchResult.matchType === "exact") {
      const clusterResult = await findExactScoreCluster(
        normalized.raw,
        searchResult.page,
        matchResult,
        config,
        cache,
        60 // max pages to scan for large tie groups
      );
      matchResult = clusterResult.matchResult;
      debug.pagesSearched.push(...clusterResult.additionalPages);
    }

    debug.matchDetails = {
      page: searchResult.page,
      matchingRanks: matchResult.ranks.length > 0 ? matchResult.ranks : undefined,
      bracketAbove: matchResult.bracketAbove,
      bracketBelow: matchResult.bracketBelow,
    };

    // Calculate percentile (pass tiebreak if provided)
    const percentileResult = calculatePercentile(
      matchResult,
      normalized.raw,
      cache.totalCompetitors,
      config.tiebreakSeconds
    );

    return {
      success: true,
      ...percentileResult,
      totalCompetitors: cache.totalCompetitors,
      matchType: matchResult.matchType === "exact" ? "exact" : "bracket",
      apiCallsMade: getApiCallCount(cache),
      debug,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      percentile: null,
      estimatedRank: null,
      totalCompetitors: 0,
      matchType: "error",
      apiCallsMade: 0,
      debug: { ...debug, error: errorMessage },
    };
  }
}

/**
 * Calculate percentile from match result.
 * If userTiebreakSeconds is provided and the cluster has tiebreak data,
 * we find the precise position within the cluster based on tiebreak time.
 */
function calculatePercentile(
  matchResult: ReturnType<typeof findMatchOnPage>,
  normalizedScore: number,
  totalCompetitors: number,
  userTiebreakSeconds?: number
): {
  percentile: number;
  percentileRange?: { best: number; worst: number };
  estimatedRank: number;
  rankRange?: { best: number; worst: number };
} {
  let estimatedRank: number;
  let rankRange: { best: number; worst: number } | undefined;

  if (matchResult.matchType === "exact" && matchResult.ranks.length > 0) {
    const bestRank = Math.min(...matchResult.ranks);
    const worstRank = Math.max(...matchResult.ranks);

    // If user provided a tiebreak, find their position within the cluster
    if (userTiebreakSeconds !== undefined && matchResult.tiebreaks?.some((t) => t !== undefined)) {
      // Collect all athletes with tiebreak data
      const athletesWithTiebreak: { rank: number; tiebreak: number }[] = [];
      for (let i = 0; i < matchResult.ranks.length; i++) {
        const tiebreak = matchResult.tiebreaks[i];
        if (tiebreak !== undefined) {
          athletesWithTiebreak.push({ rank: matchResult.ranks[i], tiebreak });
        }
      }

      if (athletesWithTiebreak.length > 0) {
        // Sort by tiebreak (lower = better)
        athletesWithTiebreak.sort((a, b) => a.tiebreak - b.tiebreak);

        // Find where user's tiebreak falls
        // Count how many athletes have a better (lower) tiebreak
        let athletesBetter = 0;
        let athletesSame = 0;

        for (const athlete of athletesWithTiebreak) {
          if (athlete.tiebreak < userTiebreakSeconds) {
            athletesBetter++;
          } else if (athlete.tiebreak === userTiebreakSeconds) {
            athletesSame++;
          }
        }

        // User's rank = best rank in cluster + number of athletes with better tiebreak
        // (We use the optimistic position among athletes with the same tiebreak)
        estimatedRank = bestRank + athletesBetter;

        // Provide range for athletes with same tiebreak
        if (athletesSame > 1) {
          rankRange = {
            best: bestRank + athletesBetter,
            worst: bestRank + athletesBetter + athletesSame - 1,
          };
        }
      } else {
        // No tiebreak data in cluster, use best rank
        estimatedRank = bestRank;
        if (bestRank !== worstRank) {
          rankRange = { best: bestRank, worst: worstRank };
        }
      }
    } else {
      // No user tiebreak provided - use best rank (optimistic estimate)
      estimatedRank = bestRank;

      if (bestRank !== worstRank) {
        rankRange = { best: bestRank, worst: worstRank };
      }
    }
  } else if (matchResult.bracketAbove && matchResult.bracketBelow) {
    // Bracket - interpolate
    estimatedRank = interpolateRank(
      normalizedScore,
      matchResult.bracketAbove,
      matchResult.bracketBelow
    );

    // Provide range based on brackets
    rankRange = {
      best: matchResult.bracketAbove.rank + 1,
      worst: matchResult.bracketBelow.rank - 1,
    };
  } else if (matchResult.bracketAbove) {
    // Score is worse than bracket
    estimatedRank = matchResult.bracketAbove.rank + 1;
  } else if (matchResult.bracketBelow) {
    // Score is better than bracket
    estimatedRank = matchResult.bracketBelow.rank - 1;
  } else {
    // Fallback - shouldn't happen
    estimatedRank = Math.round(totalCompetitors / 2);
  }

  // Ensure rank is within bounds
  estimatedRank = Math.max(1, Math.min(estimatedRank, totalCompetitors));

  // Calculate percentile using "percent better than" convention
  // Higher percentile = better (you beat X% of athletes)
  // Round to 1 decimal place
  const percentile = Math.round(
    ((totalCompetitors - estimatedRank + 1) / totalCompetitors) * 1000
  ) / 10;

  // Calculate percentile range if we have rank range
  let percentileRange: { best: number; worst: number } | undefined;
  if (rankRange) {
    percentileRange = {
      // Better rank = higher percentile
      best: Math.min(100, Math.round(
        ((totalCompetitors - rankRange.best + 1) / totalCompetitors) * 1000
      ) / 10),
      // Worse rank = lower percentile
      worst: Math.max(0.1, Math.round(
        ((totalCompetitors - rankRange.worst + 1) / totalCompetitors) * 1000
      ) / 10),
    };
  }

  return {
    percentile: Math.max(0.1, Math.min(100, percentile)),
    percentileRange,
    estimatedRank,
    rankRange,
  };
}

/**
 * Quick percentile lookup with minimal options.
 * Convenience wrapper for simple use cases.
 */
export async function quickLookup(
  year: number,
  division: number,
  workoutOrdinal: number,
  score: string,
  workout: WorkoutMetadata,
  scaled: number = 0
): Promise<{ percentile: number | null; rank: number | null; error?: string }> {
  const result = await lookupPercentile(
    { year, division, scaled, workoutOrdinal },
    score,
    workout
  );

  if (!result.success) {
    return {
      percentile: null,
      rank: null,
      error: (result.debug as LookupDebug & { error?: string })?.error || "Lookup failed",
    };
  }

  return {
    percentile: result.percentile,
    rank: result.estimatedRank,
  };
}
