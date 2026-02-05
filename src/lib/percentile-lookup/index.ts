/**
 * Anchor-based Percentile Lookup System
 *
 * This is an experimental parallel system to the existing full-sync approach.
 * It estimates percentiles by sampling strategic "anchor" pages from the
 * CrossFit leaderboard API, then using binary search to find exact rank.
 *
 * Benefits:
 * - ~12-18 API calls instead of ~4,000
 * - No database storage required
 * - Near-instant results
 *
 * Trade-offs:
 * - Percentile is estimated (typically within ~1-2%)
 * - Requires API access for each lookup
 *
 * @see /docs/percentile-lookup-methodology.md for full algorithm documentation
 */

// Main lookup functions
export { lookupPercentile, quickLookup } from "./lookup";
export { lookupOverallByPoints } from "./overall";
export type { OverallLookupResult } from "./overall";

// Types
export type {
  LookupConfig,
  LookupResult,
  LookupDebug,
  NormalizedScore,
  PageData,
  PageRow,
  AnchorPoint,
  LookupCache,
} from "./types";

// Utilities (for advanced use)
export { normalizeUserScore, normalizeApiScore, compareScores } from "./normalize";
export { createCache, getApiCallCount } from "./api-client";
export { buildAnchorMap, TARGET_PERCENTILES } from "./anchors";
export { findMatchOnPage, interpolateRank } from "./search";
