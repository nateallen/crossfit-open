/**
 * Anchor sampling for the percentile lookup.
 *
 * Anchors are strategic page samples at known percentile positions.
 * They create a coarse score→rank map for efficient binary search.
 */

import type { LookupConfig, LookupCache, AnchorPoint } from "./types";
import {
  fetchLeaderboardPage,
  percentileToRank,
  rankToPage,
  initializeCache,
} from "./api-client";

// Target percentiles for anchor sampling
// More granularity at the top where users typically care more
export const TARGET_PERCENTILES = [
  1, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99,
];

/**
 * Build anchor map by sampling pages at target percentiles.
 */
export async function buildAnchorMap(
  config: LookupConfig,
  cache: LookupCache
): Promise<AnchorPoint[]> {
  // Initialize cache if not already done (gets totals from page 1)
  if (cache.totalCompetitors === 0) {
    await initializeCache(config, cache);
  }

  const { totalCompetitors, pageSize } = cache;

  if (totalCompetitors === 0) {
    throw new Error("No competitors found");
  }

  // Calculate target pages for each percentile
  const pageTargets: Map<
    number,
    { percentiles: number[]; targetRanks: number[] }
  > = new Map();

  for (const percentile of TARGET_PERCENTILES) {
    const targetRank = percentileToRank(percentile, totalCompetitors);
    const page = rankToPage(targetRank, pageSize);

    // Group percentiles by page (deduplicate)
    const existing = pageTargets.get(page);
    if (existing) {
      existing.percentiles.push(percentile);
      existing.targetRanks.push(targetRank);
    } else {
      pageTargets.set(page, {
        percentiles: [percentile],
        targetRanks: [targetRank],
      });
    }
  }

  // Fetch each unique page
  const anchors: AnchorPoint[] = [];

  for (const [page, { percentiles, targetRanks }] of pageTargets.entries()) {
    try {
      const pageData = await fetchLeaderboardPage(config, page, cache);

      // Create anchor point for each percentile that targeted this page
      for (let i = 0; i < percentiles.length; i++) {
        anchors.push({
          percentile: percentiles[i],
          targetRank: targetRanks[i],
          page,
          pageData,
        });
      }
    } catch (error) {
      console.error(`Failed to fetch anchor page ${page}:`, error);
      // Continue with other pages
    }
  }

  // Sort anchors by percentile
  anchors.sort((a, b) => a.percentile - b.percentile);

  // Store in cache
  cache.anchors = anchors;

  return anchors;
}

/**
 * Find the bracket (two anchors) that a score falls between.
 * Returns the page range to search.
 */
export function findBracketFromAnchors(
  normalizedScore: number,
  anchors: AnchorPoint[]
): { lowPage: number; highPage: number } | null {
  if (anchors.length === 0) {
    return null;
  }

  // Check if score is within any anchor page's range
  for (const anchor of anchors) {
    const { firstScore, lastScore } = anchor.pageData;

    if (normalizedScore >= firstScore && normalizedScore <= lastScore) {
      // Score falls within this page
      return { lowPage: anchor.page, highPage: anchor.page };
    }
  }

  // Find the two anchors that bracket the score
  for (let i = 0; i < anchors.length - 1; i++) {
    const current = anchors[i];
    const next = anchors[i + 1];

    // Score is between current page's worst score and next page's best score
    if (
      normalizedScore > current.pageData.lastScore &&
      normalizedScore < next.pageData.firstScore
    ) {
      return {
        lowPage: current.page + 1,
        highPage: next.page - 1,
      };
    }
  }

  // Edge cases: score is better than best anchor or worse than worst anchor
  const bestAnchor = anchors[0];
  const worstAnchor = anchors[anchors.length - 1];

  if (normalizedScore < bestAnchor.pageData.firstScore) {
    // Score is better than top anchor - search pages 1 to first anchor
    return { lowPage: 1, highPage: bestAnchor.page };
  }

  if (normalizedScore > worstAnchor.pageData.lastScore) {
    // Score is worse than bottom anchor - search from last anchor to end
    // This needs totalPages from cache
    return { lowPage: worstAnchor.page, highPage: -1 }; // -1 means "to end"
  }

  // Shouldn't reach here, but return null if we can't find bracket
  return null;
}

/**
 * Get anchor statistics for debugging.
 */
export function getAnchorStats(cache: LookupCache): {
  anchorCount: number;
  uniquePages: number;
  percentilesCovered: number[];
} {
  const uniquePages = new Set(cache.anchors.map((a) => a.page));

  return {
    anchorCount: cache.anchors.length,
    uniquePages: uniquePages.size,
    percentilesCovered: cache.anchors.map((a) => a.percentile),
  };
}
