/**
 * Overall leaderboard lookup.
 *
 * Looks up overall rank by total points using binary search
 * against the overall leaderboard (sort=0).
 */

const CROSSFIT_API_BASE =
  "https://c3po.crossfit.com/api/leaderboards/v2/competitions/open";

const DEFAULT_PAGE_SIZE = 50;

interface OverallConfig {
  year: number;
  division: number;
  scaled: number;
}

interface OverallRow {
  overallRank: number;
  totalPoints: number;
  athleteId: string;
}

interface OverallPageData {
  page: number;
  rows: OverallRow[];
  firstRank: number;
  lastRank: number;
  firstPoints: number; // Lower is better
  lastPoints: number;
}

interface OverallCache {
  totalCompetitors: number;
  totalPages: number;
  pageSize: number;
  pages: Map<number, OverallPageData>;
  apiCalls: number;
}

export interface OverallLookupResult {
  success: boolean;
  overallRank: number | null;
  overallPercentile: number | null;
  totalCompetitors: number;
  matchType: "exact" | "bracket" | "error";
  apiCallsMade: number;
  debug?: {
    targetPoints: number;
    pagesSearched: number[];
    bracketAbove?: { rank: number; points: number };
    bracketBelow?: { rank: number; points: number };
    error?: string;
  };
}

/**
 * Fetch an overall leaderboard page (sort=0)
 */
async function fetchOverallPage(
  config: OverallConfig,
  page: number,
  cache: OverallCache
): Promise<OverallPageData> {
  // Check cache
  const cached = cache.pages.get(page);
  if (cached) {
    return cached;
  }

  // Build URL for overall leaderboard
  const url = new URL(`${CROSSFIT_API_BASE}/${config.year}/leaderboards`);
  url.searchParams.set("view", "0");
  url.searchParams.set("division", config.division.toString());
  url.searchParams.set("scaled", config.scaled.toString());
  url.searchParams.set("page", page.toString());
  url.searchParams.set("region", "0");
  url.searchParams.set("sort", "0"); // 0 = overall ranking

  cache.apiCalls++;

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`CrossFit API error: ${response.status}`);
  }

  const data = await response.json();

  // Update cache metadata
  if (page === 1) {
    cache.totalCompetitors = data.pagination.totalCompetitors;
    cache.totalPages = data.pagination.totalPages;
    cache.pageSize = data.leaderboardRows?.length || DEFAULT_PAGE_SIZE;
  }

  // Parse rows - overall leaderboard has overallRank and sum of workout ranks
  const rows: OverallRow[] = [];

  for (const row of data.leaderboardRows || []) {
    // Overall rank is in overallRank field
    const overallRank = parseInt(row.overallRank, 10);
    if (isNaN(overallRank)) continue;

    // Total points is sum of all workout ranks
    // We need to calculate it from the scores array
    let totalPoints = 0;
    let hasAllScores = true;

    for (const score of row.scores || []) {
      const rank = parseInt(score.rank, 10);
      if (!isNaN(rank) && rank > 0) {
        totalPoints += rank;
      } else {
        // Missing score - this athlete hasn't completed all workouts
        hasAllScores = false;
        break;
      }
    }

    // Only include athletes who have completed all workouts
    if (!hasAllScores) continue;

    rows.push({
      overallRank,
      totalPoints,
      athleteId: row.entrant?.competitorId || "",
    });
  }

  // Sort by overall rank
  rows.sort((a, b) => a.overallRank - b.overallRank);

  if (rows.length === 0) {
    throw new Error(`No valid rows on page ${page}`);
  }

  const pageData: OverallPageData = {
    page,
    rows,
    firstRank: rows[0].overallRank,
    lastRank: rows[rows.length - 1].overallRank,
    firstPoints: rows[0].totalPoints,
    lastPoints: rows[rows.length - 1].totalPoints,
  };

  cache.pages.set(page, pageData);
  return pageData;
}

/**
 * Binary search to find the page containing athletes with similar total points
 */
async function binarySearchByPoints(
  targetPoints: number,
  lowPage: number,
  highPage: number,
  config: OverallConfig,
  cache: OverallCache
): Promise<{ page: number; pageData: OverallPageData; pagesSearched: number[] }> {
  const pagesSearched: number[] = [];
  let bestPage = lowPage;
  let bestPageData = await fetchOverallPage(config, lowPage, cache);
  pagesSearched.push(lowPage);

  while (lowPage <= highPage) {
    const midPage = Math.floor((lowPage + highPage) / 2);

    if (!pagesSearched.includes(midPage)) {
      pagesSearched.push(midPage);
    }

    const pageData = await fetchOverallPage(config, midPage, cache);

    // Check if target points falls within this page
    // Lower points = better rank, so firstPoints <= lastPoints
    if (targetPoints >= pageData.firstPoints && targetPoints <= pageData.lastPoints) {
      return { page: midPage, pageData, pagesSearched };
    }

    // Target has fewer points (better) - search earlier pages
    if (targetPoints < pageData.firstPoints) {
      highPage = midPage - 1;
      bestPage = midPage;
      bestPageData = pageData;
    }
    // Target has more points (worse) - search later pages
    else {
      lowPage = midPage + 1;
      bestPage = midPage;
      bestPageData = pageData;
    }
  }

  return { page: bestPage, pageData: bestPageData, pagesSearched };
}

/**
 * Find the estimated rank for a given total points value
 */
function findRankByPoints(
  targetPoints: number,
  pageData: OverallPageData
): {
  matchType: "exact" | "bracket";
  rank: number;
  bracketAbove?: { rank: number; points: number };
  bracketBelow?: { rank: number; points: number };
} {
  // Look for exact match or bracket
  let bracketAbove: { rank: number; points: number } | undefined;
  let bracketBelow: { rank: number; points: number } | undefined;
  const exactMatches: number[] = [];

  for (const row of pageData.rows) {
    if (row.totalPoints === targetPoints) {
      exactMatches.push(row.overallRank);
    } else if (row.totalPoints < targetPoints) {
      // This athlete has fewer points (better rank)
      if (!bracketAbove || row.totalPoints > bracketAbove.points) {
        bracketAbove = { rank: row.overallRank, points: row.totalPoints };
      }
    } else {
      // This athlete has more points (worse rank)
      if (!bracketBelow || row.totalPoints < bracketBelow.points) {
        bracketBelow = { rank: row.overallRank, points: row.totalPoints };
      }
    }
  }

  if (exactMatches.length > 0) {
    // Use best rank among exact matches
    return {
      matchType: "exact",
      rank: Math.min(...exactMatches),
      bracketAbove,
      bracketBelow,
    };
  }

  // Interpolate between brackets
  if (bracketAbove && bracketBelow) {
    const pointsRange = bracketBelow.points - bracketAbove.points;
    const rankRange = bracketBelow.rank - bracketAbove.rank;
    const pointsFromAbove = targetPoints - bracketAbove.points;
    const interpolatedRank = Math.round(
      bracketAbove.rank + (pointsFromAbove / pointsRange) * rankRange
    );

    return {
      matchType: "bracket",
      rank: interpolatedRank,
      bracketAbove,
      bracketBelow,
    };
  }

  // Edge case - target is beyond the page bounds
  if (bracketAbove) {
    return {
      matchType: "bracket",
      rank: bracketAbove.rank + 1,
      bracketAbove,
    };
  }

  if (bracketBelow) {
    return {
      matchType: "bracket",
      rank: Math.max(1, bracketBelow.rank - 1),
      bracketBelow,
    };
  }

  // Fallback - shouldn't happen
  return {
    matchType: "bracket",
    rank: pageData.firstRank,
  };
}

/**
 * Look up overall rank by total points
 */
export async function lookupOverallByPoints(
  config: OverallConfig,
  totalPoints: number
): Promise<OverallLookupResult> {
  const debug: OverallLookupResult["debug"] = {
    targetPoints: totalPoints,
    pagesSearched: [],
  };

  const cache: OverallCache = {
    totalCompetitors: 0,
    totalPages: 0,
    pageSize: DEFAULT_PAGE_SIZE,
    pages: new Map(),
    apiCalls: 0,
  };

  try {
    // Fetch page 1 to get totals
    const page1 = await fetchOverallPage(config, 1, cache);
    debug.pagesSearched.push(1);

    // Build anchors at strategic percentiles
    const targetPercentiles = [1, 5, 10, 25, 50, 75, 90, 95, 99];
    const anchors: { page: number; firstPoints: number; lastPoints: number }[] = [];

    for (const pct of targetPercentiles) {
      const targetRank = Math.ceil((pct / 100) * cache.totalCompetitors);
      const targetPage = Math.ceil(targetRank / cache.pageSize);

      if (targetPage >= 1 && targetPage <= cache.totalPages) {
        const pageData = await fetchOverallPage(config, targetPage, cache);
        if (!debug.pagesSearched.includes(targetPage)) {
          debug.pagesSearched.push(targetPage);
        }
        anchors.push({
          page: targetPage,
          firstPoints: pageData.firstPoints,
          lastPoints: pageData.lastPoints,
        });
      }
    }

    // Find bracket from anchors
    let lowPage = 1;
    let highPage = cache.totalPages;

    for (const anchor of anchors) {
      if (anchor.lastPoints < totalPoints) {
        // Target has more points (worse) - after this anchor
        lowPage = Math.max(lowPage, anchor.page);
      }
      if (anchor.firstPoints > totalPoints) {
        // Target has fewer points (better) - before this anchor
        highPage = Math.min(highPage, anchor.page);
      }
    }

    // Binary search within bracket
    const searchResult = await binarySearchByPoints(
      totalPoints,
      lowPage,
      highPage,
      config,
      cache
    );

    debug.pagesSearched.push(
      ...searchResult.pagesSearched.filter((p) => !debug.pagesSearched.includes(p))
    );

    // Find rank on the page
    const matchResult = findRankByPoints(totalPoints, searchResult.pageData);

    debug.bracketAbove = matchResult.bracketAbove;
    debug.bracketBelow = matchResult.bracketBelow;

    // Check adjacent pages if needed
    if (matchResult.matchType === "bracket") {
      // Check page before if target might be there
      if (searchResult.page > 1 && totalPoints <= searchResult.pageData.firstPoints) {
        const prevPage = await fetchOverallPage(config, searchResult.page - 1, cache);
        debug.pagesSearched.push(searchResult.page - 1);
        const prevMatch = findRankByPoints(totalPoints, prevPage);
        if (prevMatch.matchType === "exact" ||
            (prevMatch.bracketAbove && prevMatch.bracketBelow)) {
          Object.assign(matchResult, prevMatch);
        }
      }

      // Check page after if target might be there
      if (searchResult.page < cache.totalPages &&
          totalPoints >= searchResult.pageData.lastPoints) {
        const nextPage = await fetchOverallPage(config, searchResult.page + 1, cache);
        debug.pagesSearched.push(searchResult.page + 1);
        const nextMatch = findRankByPoints(totalPoints, nextPage);
        if (nextMatch.matchType === "exact" ||
            (nextMatch.bracketAbove && nextMatch.bracketBelow)) {
          Object.assign(matchResult, nextMatch);
        }
      }
    }

    const overallRank = Math.max(1, Math.min(matchResult.rank, cache.totalCompetitors));
    const overallPercentile = Math.round(
      ((cache.totalCompetitors - overallRank + 1) / cache.totalCompetitors) * 1000
    ) / 10;

    return {
      success: true,
      overallRank,
      overallPercentile: Math.max(0.1, Math.min(100, overallPercentile)),
      totalCompetitors: cache.totalCompetitors,
      matchType: matchResult.matchType,
      apiCallsMade: cache.apiCalls,
      debug,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      overallRank: null,
      overallPercentile: null,
      totalCompetitors: cache.totalCompetitors,
      matchType: "error",
      apiCallsMade: cache.apiCalls,
      debug: { ...debug, error: errorMessage },
    };
  }
}
