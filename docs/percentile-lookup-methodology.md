# Percentile Lookup via Anchor Sampling + Binary Search

> **Status**: Experimental (parallel to existing full-sync approach)
> **Date**: 2026-02-05
> **Goal**: Estimate percentile with ~12-18 API calls instead of syncing all ~200k scores

---

## Overview

Instead of syncing the entire leaderboard, this approach:
1. Samples "anchor" pages at known percentile positions (1%, 5%, 10%, etc.)
2. Uses those anchors to bracket where the user's score falls
3. Binary searches to find the exact page
4. Extracts rank from exact match or bracketing rows
5. Calculates percentile from rank/total

---

## Score Normalization

All scores normalized to a single number where **lower = better rank**:

| Score Type | Example | Normalized | Logic |
|------------|---------|------------|-------|
| Time (lower=better) | `10:30` | `630` | Seconds |
| Reps (higher=better) | `185` | `-185` | Negative reps |
| Hybrid (finisher) | `10:30` | `630` | Seconds |
| Hybrid (capped) | `138 reps` (cap=170) | `1000032` | `1000000 + (170-138)` |

The 1,000,000 offset ensures all finishers rank above all capped athletes.

---

## Algorithm

### Phase 1: Initialize
- Fetch page 1
- Extract: `totalCompetitors`, `totalPages`, `pageSize`
- Cache page 1 data

### Phase 2: Build Anchor Map
Target percentiles: `[1, 5, 10, 20, 30, 50, 70, 80, 90, 95, 99]`

For each percentile `p`:
```
targetRank = ceil((p / 100) * totalCompetitors)
targetPage = ceil(targetRank / pageSize)
```

Fetch unique pages, record score ranges.

### Phase 3: Find Bracket
Scan anchors to find which two bracket the user's score.

### Phase 4: Binary Search
```
while highPage - lowPage > 1:
    midPage = (low + high) / 2
    if userScore < page.firstScore: highPage = mid
    else if userScore > page.lastScore: lowPage = mid
    else: found!
```

### Phase 5: Find Match/Bracket on Page
- Scan for exact score match → use that rank
- If no match, find bracketing rows → interpolate rank

### Phase 6: Calculate Percentile
```
percentile = (rank / totalCompetitors) * 100
```

---

## API Call Budget

| Phase | Calls | Purpose |
|-------|-------|---------|
| Initialize | 1 | Get totals |
| Anchor sampling | 8-10 | Build score→rank map |
| Binary search | 3-5 | Find target page |
| Boundary refinement | 0-2 | Adjacent pages |
| **Total** | **12-18** | vs ~4,000 for full sync |

---

## Example Walk-Through

**Input**: score = "138 reps" on 24.3 (cap = 170 reps)

1. **Normalize**: `1000000 + (170 - 138) = 1,000,032`

2. **Initialize**: totalCompetitors = 150,000, pageSize = 50

3. **Anchors sampled**:
   - 20%: page 600, scores 1,000,005 - 1,000,012
   - 30%: page 900, scores 1,000,025 - 1,000,032

4. **Bracket found**: User score (1,000,032) is within 30% anchor page range

5. **Match on page 900**: Ranks 44,963-44,977 have 138 reps

6. **Result**: `(44,963 / 150,000) * 100 = 29.98%`

---

## File Structure (New Code)

```
src/lib/percentile-lookup/
├── index.ts           # Main lookup function
├── normalize.ts       # Score normalization
├── anchors.ts         # Anchor sampling logic
├── search.ts          # Binary search
├── cache.ts           # Page caching
└── types.ts           # TypeScript types

src/app/api/percentile-lookup/
└── route.ts           # API endpoint for lookup
```

---

## Reverting

To revert, simply:
1. Remove `src/lib/percentile-lookup/` directory
2. Remove `src/app/api/percentile-lookup/` directory
3. No changes to existing sync/percentile code needed

---

## Comparison to Existing System

| Aspect | Existing (Full Sync) | New (Anchor Lookup) |
|--------|---------------------|---------------------|
| API calls | ~4,000 | ~15 |
| Storage | ~200k rows | In-memory cache |
| Accuracy | Exact | ~1-2% margin |
| Setup time | Hours | Seconds |
| Offline | Yes | No |
| Hierarchy support | Yes | Yes (separate calls per tier) |
