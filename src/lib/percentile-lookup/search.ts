/**
 * Binary search and match finding for percentile lookup.
 *
 * After anchors give us a bracket, we binary search to find the exact page,
 * then find exact matches or bracketing rows on that page.
 */

import type { LookupConfig, LookupCache, PageData, PageRow } from "./types";
import { fetchLeaderboardPage } from "./api-client";
import { scoreInRange } from "./normalize";

export interface SearchResult {
  page: number;
  pageData: PageData;
  pagesSearched: number[];
}

export interface MatchResult {
  matchType: "exact" | "bracket" | "edge_better" | "edge_worse";
  /** For exact matches: all ranks that have this exact score */
  ranks: number[];
  /** Tiebreak times (in seconds) for athletes in the cluster, parallel to ranks */
  tiebreaks: (number | undefined)[];
  /** Best rank in bracket (better than user score) */
  bracketAbove?: PageRow;
  /** Worst rank in bracket (worse than user score) */
  bracketBelow?: PageRow;
}

/**
 * Binary search to find the page containing a score.
 */
export async function binarySearchForPage(
  normalizedScore: number,
  lowPage: number,
  highPage: number,
  config: LookupConfig,
  cache: LookupCache
): Promise<SearchResult> {
  const pagesSearched: number[] = [];

  // Handle "to end" marker
  if (highPage === -1) {
    highPage = cache.totalPages;
  }

  // Ensure we have valid bounds
  lowPage = Math.max(1, lowPage);
  highPage = Math.min(highPage, cache.totalPages);

  let targetPage: number | null = null;
  let targetPageData: PageData | null = null;

  while (lowPage <= highPage) {
    const midPage = Math.floor((lowPage + highPage) / 2);

    const pageData = await fetchLeaderboardPage(config, midPage, cache);
    pagesSearched.push(midPage);

    const { firstScore, lastScore } = pageData;

    // Check if score falls within this page's range
    if (scoreInRange(normalizedScore, firstScore, lastScore)) {
      targetPage = midPage;
      targetPageData = pageData;
      break;
    }

    // Score is better than everyone on this page (lower normalized value)
    if (normalizedScore < firstScore) {
      highPage = midPage - 1;
    }
    // Score is worse than everyone on this page (higher normalized value)
    else if (normalizedScore > lastScore) {
      lowPage = midPage + 1;
    }
  }

  // If we didn't find an exact page match, use the closest boundary
  if (!targetPage || !targetPageData) {
    // Try fetching the boundary pages
    const boundaryPage = Math.min(lowPage, cache.totalPages);
    targetPageData = await fetchLeaderboardPage(config, boundaryPage, cache);
    targetPage = boundaryPage;
    if (!pagesSearched.includes(boundaryPage)) {
      pagesSearched.push(boundaryPage);
    }
  }

  return {
    page: targetPage,
    pageData: targetPageData,
    pagesSearched,
  };
}

/**
 * Find exact match or bracket on a page.
 */
export function findMatchOnPage(
  normalizedScore: number,
  pageData: PageData
): MatchResult {
  const { rows } = pageData;
  const exactMatches: number[] = [];
  const tiebreaks: (number | undefined)[] = [];
  let bracketAbove: PageRow | undefined;
  let bracketBelow: PageRow | undefined;

  for (const row of rows) {
    // Exact match
    if (row.scoreNormalized === normalizedScore) {
      exactMatches.push(row.rank);
      tiebreaks.push(row.tiebreakSeconds);
    }
    // Row is better than user (lower normalized score)
    else if (row.scoreNormalized < normalizedScore) {
      // Keep updating - we want the worst "better" row (closest to user)
      bracketAbove = row;
    }
    // Row is worse than user (higher normalized score)
    else if (row.scoreNormalized > normalizedScore && !bracketBelow) {
      // First worse row found
      bracketBelow = row;
    }
  }

  // Determine match type
  if (exactMatches.length > 0) {
    return {
      matchType: "exact",
      ranks: exactMatches,
      tiebreaks,
      bracketAbove,
      bracketBelow,
    };
  }

  if (bracketAbove && bracketBelow) {
    return {
      matchType: "bracket",
      ranks: [],
      tiebreaks: [],
      bracketAbove,
      bracketBelow,
    };
  }

  // Edge cases: score is outside the page's range
  if (!bracketAbove && bracketBelow) {
    // User score is better than everyone on this page
    return {
      matchType: "edge_better",
      ranks: [],
      tiebreaks: [],
      bracketBelow,
    };
  }

  if (bracketAbove && !bracketBelow) {
    // User score is worse than everyone on this page
    return {
      matchType: "edge_worse",
      ranks: [],
      tiebreaks: [],
      bracketAbove,
    };
  }

  // Shouldn't happen, but handle empty result
  return {
    matchType: "bracket",
    ranks: [],
    tiebreaks: [],
  };
}

/**
 * Try to refine match by checking adjacent pages.
 * Useful when score is at a page boundary.
 */
export async function refineMatchWithAdjacentPages(
  normalizedScore: number,
  currentPage: number,
  matchResult: MatchResult,
  config: LookupConfig,
  cache: LookupCache
): Promise<{ matchResult: MatchResult; additionalPages: number[] }> {
  const additionalPages: number[] = [];

  // If we have an edge case, try adjacent page
  if (matchResult.matchType === "edge_better" && currentPage > 1) {
    // Score is better than everyone - check previous page
    const prevPage = await fetchLeaderboardPage(config, currentPage - 1, cache);
    additionalPages.push(currentPage - 1);

    const prevMatch = findMatchOnPage(normalizedScore, prevPage);
    if (prevMatch.matchType === "exact" || prevMatch.matchType === "bracket") {
      return { matchResult: prevMatch, additionalPages };
    }

    // Merge bracket info
    if (prevMatch.bracketAbove) {
      matchResult.bracketAbove = prevMatch.bracketAbove;
      if (matchResult.bracketBelow) {
        matchResult.matchType = "bracket";
      }
    }
  }

  if (matchResult.matchType === "edge_worse" && currentPage < cache.totalPages) {
    // Score is worse than everyone - check next page
    const nextPage = await fetchLeaderboardPage(config, currentPage + 1, cache);
    additionalPages.push(currentPage + 1);

    const nextMatch = findMatchOnPage(normalizedScore, nextPage);
    if (nextMatch.matchType === "exact" || nextMatch.matchType === "bracket") {
      return { matchResult: nextMatch, additionalPages };
    }

    // Merge bracket info
    if (nextMatch.bracketBelow) {
      matchResult.bracketBelow = nextMatch.bracketBelow;
      if (matchResult.bracketAbove) {
        matchResult.matchType = "bracket";
      }
    }
  }

  return { matchResult, additionalPages };
}

/**
 * Calculate estimated rank from bracket (linear interpolation).
 */
export function interpolateRank(
  normalizedScore: number,
  bracketAbove: PageRow,
  bracketBelow: PageRow
): number {
  const scoreRange = bracketBelow.scoreNormalized - bracketAbove.scoreNormalized;
  const rankRange = bracketBelow.rank - bracketAbove.rank;

  if (scoreRange === 0) {
    // Same score, use average rank
    return Math.round((bracketAbove.rank + bracketBelow.rank) / 2);
  }

  const scoreOffset = normalizedScore - bracketAbove.scoreNormalized;
  const rankOffset = (scoreOffset / scoreRange) * rankRange;

  return Math.round(bracketAbove.rank + rankOffset);
}

/**
 * Find the exact score cluster by scanning adjacent pages.
 *
 * CrossFit uses "worst rank among ties" for percentile calculation,
 * so we need to scan forward aggressively to find all athletes with the same score.
 * Also collects tiebreak times to allow precise ranking within the cluster.
 */
export async function findExactScoreCluster(
  normalizedScore: number,
  startPage: number,
  matchResult: MatchResult,
  config: LookupConfig,
  cache: LookupCache,
  maxPagesToScan: number = 60 // Increased to handle large tie groups
): Promise<{ matchResult: MatchResult; additionalPages: number[] }> {
  const additionalPages: number[] = [];
  const exactMatches: { rank: number; tiebreakSeconds?: number }[] = [];

  // Initialize with existing matches
  for (let i = 0; i < matchResult.ranks.length; i++) {
    exactMatches.push({
      rank: matchResult.ranks[i],
      tiebreakSeconds: matchResult.tiebreaks[i],
    });
  }

  let bracketAbove = matchResult.bracketAbove;
  let bracketBelow = matchResult.bracketBelow;

  // Search backwards (better ranks) to find first athlete with this score
  if (startPage > 1) {
    let page = startPage - 1;
    let pagesScanned = 0;
    const maxBackward = Math.min(maxPagesToScan / 4, 10); // Don't go too far back

    while (page >= 1 && pagesScanned < maxBackward) {
      const pageData = await fetchLeaderboardPage(config, page, cache);
      additionalPages.push(page);
      pagesScanned++;

      let foundMatchOnPage = false;

      for (const row of pageData.rows) {
        if (row.scoreNormalized === normalizedScore) {
          exactMatches.push({
            rank: row.rank,
            tiebreakSeconds: row.tiebreakSeconds,
          });
          foundMatchOnPage = true;
        } else if (row.scoreNormalized < normalizedScore) {
          // Found a better score - update bracket
          bracketAbove = row;
        }
      }

      // If no matches found on this page, we've found the start of the cluster
      if (!foundMatchOnPage) {
        break;
      }

      page--;
    }
  }

  // Search forwards (worse ranks) to find last athlete with this score
  // This is the important direction for CrossFit's "worst rank" convention
  if (startPage < cache.totalPages) {
    let page = startPage + 1;
    let pagesScanned = 0;
    const maxForward = maxPagesToScan * 3 / 4; // Prioritize forward scanning

    while (page <= cache.totalPages && pagesScanned < maxForward) {
      const pageData = await fetchLeaderboardPage(config, page, cache);
      additionalPages.push(page);
      pagesScanned++;

      let foundMatchOnPage = false;

      for (const row of pageData.rows) {
        if (row.scoreNormalized === normalizedScore) {
          exactMatches.push({
            rank: row.rank,
            tiebreakSeconds: row.tiebreakSeconds,
          });
          foundMatchOnPage = true;
        } else if (row.scoreNormalized > normalizedScore && !bracketBelow) {
          // Found first worse score - this is the end of our cluster
          bracketBelow = row;
        }
      }

      // If we found a worse score on this page, we've found the end of the cluster
      if (bracketBelow && !foundMatchOnPage) {
        break;
      }

      // If the entire page had no matches and no bracket below was set, stop
      if (!foundMatchOnPage && pagesScanned > 5) {
        break;
      }

      page++;
    }
  }

  // Build updated match result
  if (exactMatches.length > 0) {
    // Sort by rank to maintain order
    exactMatches.sort((a, b) => a.rank - b.rank);

    return {
      matchResult: {
        matchType: "exact",
        ranks: exactMatches.map((m) => m.rank),
        tiebreaks: exactMatches.map((m) => m.tiebreakSeconds),
        bracketAbove,
        bracketBelow,
      },
      additionalPages,
    };
  }

  // No exact matches found, return improved brackets
  return {
    matchResult: {
      ...matchResult,
      bracketAbove,
      bracketBelow,
    },
    additionalPages,
  };
}
