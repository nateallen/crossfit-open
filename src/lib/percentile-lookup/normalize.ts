/**
 * Score normalization for the anchor-based percentile lookup.
 *
 * All scores are normalized to a single numeric value where:
 * - LOWER value = BETTER rank (matches ascending rank order in API)
 *
 * This allows consistent comparison across different score types.
 */

import type { WorkoutMetadata } from "@/types";
import type { NormalizedScore } from "./types";

// Large offset to ensure capped athletes always rank after finishers
const CAPPED_OFFSET = 1_000_000;

/**
 * Normalize a user-entered score to a comparable numeric value.
 * Lower values = better rank.
 */
export function normalizeUserScore(
  scoreInput: string,
  workout: WorkoutMetadata
): NormalizedScore | null {
  const input = scoreInput.trim().toLowerCase();

  if (!input) {
    return null;
  }

  // Handle hybrid workouts (time for finishers, reps for capped)
  if (workout.cappedScoreType === "reps" && workout.totalReps) {
    return normalizeHybridScore(input, workout);
  }

  // Handle by score type
  switch (workout.scoreType) {
    case "time":
      return normalizeTimeScore(input, workout);
    case "reps":
      return normalizeRepsScore(input);
    case "rounds_reps":
      return normalizeRoundsRepsScore(input, workout);
    case "load":
      return normalizeLoadScore(input);
    default:
      return null;
  }
}

/**
 * Normalize a score display string from the API.
 * This is used when parsing leaderboard rows.
 */
export function normalizeApiScore(
  scoreDisplay: string,
  workout: WorkoutMetadata
): NormalizedScore | null {
  // Strip any scaled/foundations suffix (e.g., " - s" or " - f")
  let normalized = scoreDisplay.toLowerCase().trim();
  normalized = normalized.replace(/\s*-\s*[sf]$/, "");

  // Handle hybrid workouts
  if (workout.cappedScoreType === "reps" && workout.totalReps) {
    return normalizeHybridApiScore(normalized, workout);
  }

  // Handle by score type
  switch (workout.scoreType) {
    case "time":
      return normalizeTimeScore(normalized, workout);
    case "reps":
      return normalizeRepsScore(normalized);
    case "rounds_reps":
      return normalizeRoundsRepsScore(normalized, workout);
    case "load":
      return normalizeLoadScore(normalized);
    default:
      return null;
  }
}

/**
 * Normalize a hybrid workout score (finisher time or capped reps).
 */
function normalizeHybridScore(
  input: string,
  workout: WorkoutMetadata
): NormalizedScore | null {
  const normalized = input.replace(/\s+/g, "");

  // Try time format first (finisher): "10:30" or "10m30s"
  const timeResult = parseTimeFormat(normalized);
  if (timeResult !== null) {
    // Validate against time cap
    if (workout.timeCapSeconds && timeResult > workout.timeCapSeconds) {
      return null; // Invalid: exceeds cap
    }
    return {
      raw: timeResult, // Seconds (lower = better)
      display: formatTime(timeResult),
      isFinisher: true,
    };
  }

  // Try reps format (capped): "138" or "138 reps"
  const repsMatch = normalized.match(/^(\d+)(reps)?$/);
  if (repsMatch && workout.totalReps) {
    const reps = parseInt(repsMatch[1], 10);

    if (reps < 0 || reps >= workout.totalReps) {
      return null; // Invalid
    }

    // Encode: offset + (totalReps - reps)
    // Higher reps = lower encoded value = better rank
    const encodedValue = CAPPED_OFFSET + (workout.totalReps - reps);

    return {
      raw: encodedValue,
      display: `${reps} reps (capped)`,
      isFinisher: false,
    };
  }

  return null;
}

/**
 * Normalize a hybrid score from API display format.
 */
function normalizeHybridApiScore(
  input: string,
  workout: WorkoutMetadata
): NormalizedScore | null {
  // Check for time format (finisher): "10:29"
  const timeMatch = input.match(/^(\d+):(\d{2})$/);
  if (timeMatch) {
    const seconds = parseInt(timeMatch[1], 10) * 60 + parseInt(timeMatch[2], 10);
    return {
      raw: seconds,
      display: input,
      isFinisher: true,
    };
  }

  // Check for reps format (capped): "158 reps" or just "158"
  const repsMatch = input.match(/^(\d+)\s*reps?$/);
  const numOnlyMatch = input.match(/^(\d+)$/);

  if ((repsMatch || numOnlyMatch) && workout.totalReps) {
    const reps = parseInt((repsMatch || numOnlyMatch)![1], 10);
    const encodedValue = CAPPED_OFFSET + (workout.totalReps - reps);

    return {
      raw: encodedValue,
      display: `${reps} reps`,
      isFinisher: false,
    };
  }

  return null;
}

/**
 * Normalize a time score.
 * Lower time = better = lower normalized value.
 */
function normalizeTimeScore(
  input: string,
  workout: WorkoutMetadata
): NormalizedScore | null {
  const normalized = input.replace(/\s+/g, "");

  const seconds = parseTimeFormat(normalized);
  if (seconds === null) {
    return null;
  }

  // Validate against time cap
  if (workout.timeCapSeconds && seconds > workout.timeCapSeconds) {
    return null;
  }

  return {
    raw: seconds, // Lower is better
    display: formatTime(seconds),
  };
}

/**
 * Normalize a reps score.
 * Higher reps = better, so we negate for "lower = better" convention.
 */
function normalizeRepsScore(input: string): NormalizedScore | null {
  const normalized = input.replace(/\s+/g, "");

  const match = normalized.match(/^(\d+)(reps)?$/);
  if (!match) {
    return null;
  }

  const reps = parseInt(match[1], 10);
  if (reps < 0) {
    return null;
  }

  return {
    raw: -reps, // Negative so lower = better (more reps)
    display: `${reps} reps`,
  };
}

/**
 * Normalize a rounds+reps score.
 * Higher rounds+reps = better, so we negate.
 */
function normalizeRoundsRepsScore(
  input: string,
  workout: WorkoutMetadata
): NormalizedScore | null {
  const normalized = input.replace(/\s+/g, "");

  // Try "7+12" format
  const plusMatch = normalized.match(/^(\d+)\+(\d+)$/);
  if (plusMatch) {
    const rounds = parseInt(plusMatch[1], 10);
    const reps = parseInt(plusMatch[2], 10);

    const repsPerRound = workout.repsPerRound || 1;
    const totalReps = rounds * repsPerRound + reps;

    return {
      raw: -totalReps, // Negative so lower = better
      display: `${rounds}+${reps}`,
    };
  }

  return null;
}

/**
 * Normalize a load score.
 * Higher load = better, so we negate.
 */
function normalizeLoadScore(input: string): NormalizedScore | null {
  const normalized = input.replace(/\s+/g, "");

  const match = normalized.match(/^(\d+(?:\.\d+)?)(lb|lbs|kg|kgs)?$/);
  if (!match) {
    return null;
  }

  let weight = parseFloat(match[1]);
  const unit = match[2] || "lb";

  // Convert kg to lb
  if (unit === "kg" || unit === "kgs") {
    weight = weight * 2.20462;
  }

  if (weight <= 0) {
    return null;
  }

  return {
    raw: -Math.round(weight), // Negative so lower = better (heavier lift)
    display: `${Math.round(weight)} lb`,
  };
}

/**
 * Parse various time formats into seconds.
 */
function parseTimeFormat(input: string): number | null {
  // MM:SS format
  const colonMatch = input.match(/^(\d{1,2}):(\d{2})$/);
  if (colonMatch) {
    const minutes = parseInt(colonMatch[1], 10);
    const seconds = parseInt(colonMatch[2], 10);
    if (seconds >= 60) return null;
    return minutes * 60 + seconds;
  }

  // XmYYs format
  const minsecMatch = input.match(/^(\d{1,2})m(\d{2})s?$/);
  if (minsecMatch) {
    const minutes = parseInt(minsecMatch[1], 10);
    const seconds = parseInt(minsecMatch[2], 10);
    if (seconds >= 60) return null;
    return minutes * 60 + seconds;
  }

  // Just seconds with 's' suffix
  const secondsOnly = input.match(/^(\d+)s$/);
  if (secondsOnly) {
    return parseInt(secondsOnly[1], 10);
  }

  return null;
}

/**
 * Format seconds into MM:SS display.
 */
function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Compare two normalized scores.
 * Returns:
 *   -1 if scoreA is BETTER (would rank higher)
 *    0 if tied
 *    1 if scoreA is WORSE (would rank lower)
 */
export function compareScores(scoreA: number, scoreB: number): -1 | 0 | 1 {
  if (scoreA < scoreB) return -1;
  if (scoreA > scoreB) return 1;
  return 0;
}

/**
 * Check if a score falls within a range (for page boundary checks).
 */
export function scoreInRange(
  score: number,
  firstScore: number,
  lastScore: number
): boolean {
  // firstScore should be the better score (lower value)
  // lastScore should be the worse score (higher value)
  return score >= firstScore && score <= lastScore;
}
