import type { ParsedScore, ScoreType, WorkoutMetadata } from "@/types";

/**
 * Parse a user-entered score string into a normalized score object.
 * Handles time, reps, rounds+reps, and load formats.
 */
export function parseScore(
  input: string,
  workout: WorkoutMetadata
): ParsedScore {
  const trimmed = input.trim();

  if (!trimmed) {
    return {
      isValid: false,
      error: "Please enter a score",
      scoreType: workout.scoreType,
      scorePrimaryRaw: 0,
      scorePrimaryDisplay: "",
    };
  }

  switch (workout.scoreType) {
    case "time":
      return parseTimeScore(trimmed, workout);
    case "reps":
      return parseRepsScore(trimmed);
    case "rounds_reps":
      return parseRoundsRepsScore(trimmed, workout);
    case "load":
      return parseLoadScore(trimmed);
    default:
      return {
        isValid: false,
        error: "Unknown score type",
        scoreType: workout.scoreType,
        scorePrimaryRaw: 0,
        scorePrimaryDisplay: "",
      };
  }
}

const CAPPED_OFFSET = 1000000; // Large offset to ensure capped athletes are always after finishers

/**
 * Parse a time score (e.g., "6:01", "10:30", "6m01s")
 * For hybrid workouts, also accepts reps input for capped athletes (e.g., "136 reps")
 * Returns time in seconds for finishers, or encoded value for capped
 */
function parseTimeScore(
  input: string,
  workout: WorkoutMetadata
): ParsedScore {
  const normalized = input.toLowerCase().replace(/\s+/g, "");

  // Try MM:SS or M:SS format (finisher)
  const colonMatch = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (colonMatch) {
    const minutes = parseInt(colonMatch[1], 10);
    const seconds = parseInt(colonMatch[2], 10);

    if (seconds >= 60) {
      return {
        isValid: false,
        error: "Seconds must be 0-59",
        scoreType: "time",
        scorePrimaryRaw: 0,
        scorePrimaryDisplay: "",
      };
    }

    const totalSeconds = minutes * 60 + seconds;
    return validateTimeScore(totalSeconds, workout);
  }

  // Try XmYYs format (e.g., "6m01s") (finisher)
  const minsecMatch = normalized.match(/^(\d{1,2})m(\d{2})s?$/);
  if (minsecMatch) {
    const minutes = parseInt(minsecMatch[1], 10);
    const seconds = parseInt(minsecMatch[2], 10);

    if (seconds >= 60) {
      return {
        isValid: false,
        error: "Seconds must be 0-59",
        scoreType: "time",
        scorePrimaryRaw: 0,
        scorePrimaryDisplay: "",
      };
    }

    const totalSeconds = minutes * 60 + seconds;
    return validateTimeScore(totalSeconds, workout);
  }

  // For hybrid workouts (time/reps), check for reps input (capped athlete)
  if (workout.cappedScoreType === "reps" && workout.totalReps) {
    const repsMatch = normalized.match(/^(\d+)(reps)?$/);
    if (repsMatch) {
      const reps = parseInt(repsMatch[1], 10);

      if (reps < 0) {
        return {
          isValid: false,
          error: "Reps must be 0 or greater",
          scoreType: "time",
          scorePrimaryRaw: 0,
          scorePrimaryDisplay: "",
        };
      }

      if (reps >= workout.totalReps) {
        return {
          isValid: false,
          error: `Capped at ${workout.totalReps} reps. Enter a time if you finished.`,
          scoreType: "time",
          scorePrimaryRaw: 0,
          scorePrimaryDisplay: "",
        };
      }

      // Encode capped score: offset + (totalReps - reps)
      // Higher reps = lower encoded value = better rank
      const encodedScore = CAPPED_OFFSET + (workout.totalReps - reps);

      return {
        isValid: true,
        scoreType: "time",
        scorePrimaryRaw: encodedScore,
        scorePrimaryDisplay: `${reps} reps (capped)`,
      };
    }
  }

  // Try just seconds (e.g., "361") - only if it's a reasonable time
  const secondsOnly = normalized.match(/^(\d+)s$/);
  if (secondsOnly) {
    const totalSeconds = parseInt(secondsOnly[1], 10);
    return validateTimeScore(totalSeconds, workout);
  }

  // For hybrid workouts, give a more helpful error
  if (workout.cappedScoreType === "reps") {
    return {
      isValid: false,
      error: 'Enter time (e.g., "10:30") if finished, or reps (e.g., "136") if capped',
      scoreType: "time",
      scorePrimaryRaw: 0,
      scorePrimaryDisplay: "",
    };
  }

  return {
    isValid: false,
    error: 'Invalid time format. Try "6:01" or "6m01s"',
    scoreType: "time",
    scorePrimaryRaw: 0,
    scorePrimaryDisplay: "",
  };
}

function validateTimeScore(
  totalSeconds: number,
  workout: WorkoutMetadata
): ParsedScore {
  if (totalSeconds <= 0) {
    return {
      isValid: false,
      error: "Time must be greater than 0",
      scoreType: "time",
      scorePrimaryRaw: 0,
      scorePrimaryDisplay: "",
    };
  }

  // Check against time cap if present
  if (workout.timeCapSeconds && totalSeconds > workout.timeCapSeconds) {
    return {
      isValid: false,
      error: `Time exceeds cap of ${formatTime(workout.timeCapSeconds)}`,
      scoreType: "time",
      scorePrimaryRaw: 0,
      scorePrimaryDisplay: "",
    };
  }

  return {
    isValid: true,
    scoreType: "time",
    scorePrimaryRaw: totalSeconds,
    scorePrimaryDisplay: formatTime(totalSeconds),
  };
}

/**
 * Parse a reps score (e.g., "185", "185 reps")
 */
function parseRepsScore(input: string): ParsedScore {
  const normalized = input.toLowerCase().replace(/\s+/g, "");

  // Match number optionally followed by "reps"
  const match = normalized.match(/^(\d+)(reps)?$/);
  if (!match) {
    return {
      isValid: false,
      error: 'Invalid reps format. Try "185" or "185 reps"',
      scoreType: "reps",
      scorePrimaryRaw: 0,
      scorePrimaryDisplay: "",
    };
  }

  const reps = parseInt(match[1], 10);

  if (reps < 0) {
    return {
      isValid: false,
      error: "Reps must be 0 or greater",
      scoreType: "reps",
      scorePrimaryRaw: 0,
      scorePrimaryDisplay: "",
    };
  }

  return {
    isValid: true,
    scoreType: "reps",
    scorePrimaryRaw: reps,
    scorePrimaryDisplay: `${reps} reps`,
  };
}

/**
 * Parse a rounds+reps score (e.g., "7+12", "7 rounds + 12 reps")
 * Returns total reps based on workout's repsPerRound
 */
function parseRoundsRepsScore(
  input: string,
  workout: WorkoutMetadata
): ParsedScore {
  const normalized = input.toLowerCase().replace(/\s+/g, "");

  // Try R+r format (e.g., "7+12")
  const plusMatch = normalized.match(/^(\d+)\+(\d+)$/);
  if (plusMatch) {
    const rounds = parseInt(plusMatch[1], 10);
    const reps = parseInt(plusMatch[2], 10);
    return validateRoundsReps(rounds, reps, workout);
  }

  // Try verbose format (e.g., "7rounds+12" or "7rounds12reps")
  const verboseMatch = normalized.match(/^(\d+)rounds?\+?(\d+)(reps)?$/);
  if (verboseMatch) {
    const rounds = parseInt(verboseMatch[1], 10);
    const reps = parseInt(verboseMatch[2], 10);
    return validateRoundsReps(rounds, reps, workout);
  }

  return {
    isValid: false,
    error: 'Invalid format. Try "7+12" for 7 rounds + 12 reps',
    scoreType: "rounds_reps",
    scorePrimaryRaw: 0,
    scorePrimaryDisplay: "",
  };
}

function validateRoundsReps(
  rounds: number,
  reps: number,
  workout: WorkoutMetadata
): ParsedScore {
  if (rounds < 0 || reps < 0) {
    return {
      isValid: false,
      error: "Rounds and reps must be 0 or greater",
      scoreType: "rounds_reps",
      scorePrimaryRaw: 0,
      scorePrimaryDisplay: "",
    };
  }

  // Validate reps against repsPerRound if known
  if (workout.repsPerRound && reps >= workout.repsPerRound) {
    return {
      isValid: false,
      error: `Reps must be less than ${workout.repsPerRound} (reps per round)`,
      scoreType: "rounds_reps",
      scorePrimaryRaw: 0,
      scorePrimaryDisplay: "",
    };
  }

  // Calculate total reps
  const repsPerRound = workout.repsPerRound || 1;
  const totalReps = rounds * repsPerRound + reps;

  return {
    isValid: true,
    scoreType: "rounds_reps",
    scorePrimaryRaw: totalReps,
    scorePrimaryDisplay: `${rounds}+${reps}`,
  };
}

/**
 * Parse a load score (e.g., "225", "225 lb", "100 kg")
 * Normalizes to pounds
 */
function parseLoadScore(input: string): ParsedScore {
  const normalized = input.toLowerCase().replace(/\s+/g, "");

  // Match number optionally followed by unit
  const match = normalized.match(/^(\d+(?:\.\d+)?)(lb|lbs|kg|kgs)?$/);
  if (!match) {
    return {
      isValid: false,
      error: 'Invalid load format. Try "225" or "225 lb" or "100 kg"',
      scoreType: "load",
      scorePrimaryRaw: 0,
      scorePrimaryDisplay: "",
    };
  }

  let weight = parseFloat(match[1]);
  const unit = match[2] || "lb";

  // Convert kg to lb
  if (unit === "kg" || unit === "kgs") {
    weight = Math.round(weight * 2.20462);
  }

  if (weight <= 0) {
    return {
      isValid: false,
      error: "Weight must be greater than 0",
      scoreType: "load",
      scorePrimaryRaw: 0,
      scorePrimaryDisplay: "",
    };
  }

  return {
    isValid: true,
    scoreType: "load",
    scorePrimaryRaw: Math.round(weight),
    scorePrimaryDisplay: `${Math.round(weight)} lb`,
  };
}

/**
 * Format seconds into MM:SS display
 */
export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Parse a scoreDisplay string from the API into a raw numeric value.
 * This is used when syncing leaderboard data.
 */
export function parseScoreDisplay(
  scoreDisplay: string,
  scoreType: ScoreType
): number | null {
  // Strip any scaled/foundations suffix (e.g., " - s" or " - f")
  let normalized = scoreDisplay.toLowerCase().trim();
  normalized = normalized.replace(/\s*-\s*[sf]$/, "");

  switch (scoreType) {
    case "time": {
      // Parse "10:29" format
      const match = normalized.match(/^(\d+):(\d{2})$/);
      if (match) {
        return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
      }
      return null;
    }

    case "reps": {
      // Parse "459 reps" format
      const match = normalized.match(/^(\d+)\s*reps?$/);
      if (match) {
        return parseInt(match[1], 10);
      }
      // Sometimes just a number
      const numMatch = normalized.match(/^(\d+)$/);
      if (numMatch) {
        return parseInt(numMatch[1], 10);
      }
      return null;
    }

    case "rounds_reps": {
      // Parse "14+8" or "14 rounds +8 reps" format
      // Note: This returns the display value, not total reps
      // (total reps calculation requires workout metadata)
      const match = normalized.match(/(\d+)\s*(?:rounds?)?\s*\+\s*(\d+)/);
      if (match) {
        // Return as encoded value: rounds * 1000 + reps
        return parseInt(match[1], 10) * 1000 + parseInt(match[2], 10);
      }
      return null;
    }

    case "load": {
      // Parse "185 lbs" or "185 lb" format
      const match = normalized.match(/^(\d+)\s*(?:lbs?|kg)?$/);
      if (match) {
        return parseInt(match[1], 10);
      }
      return null;
    }

    default:
      return null;
  }
}

/**
 * Result of parsing a hybrid workout score from the API.
 */
export interface HybridScoreResult {
  /** Whether the athlete finished (time) or was capped (reps) */
  isFinisher: boolean;
  /** The raw score value (seconds for finishers, reps for capped) */
  scorePrimaryRaw: number;
  /** The tiebreak time in seconds (for capped athletes) */
  tiebreakSeconds?: number;
}

/**
 * Parse a scoreDisplay from a hybrid workout (time/reps).
 * Hybrid workouts can have either time (finishers) or reps (capped).
 *
 * For ranking: finishers are always ranked above capped athletes.
 * We encode this by using negative values for finishers (so lower = better)
 * and positive values for capped (higher reps = better, but still worse than any finisher).
 *
 * Encoding for sortable score (ASC sort = better):
 * - Finisher: time in seconds (e.g., 542 for 9:02)
 * - Capped: totalReps * 1000 - reps (e.g., 180000 - 158 = 179842 for 158 reps on 24.1)
 *   This ensures all finishers rank above all capped athletes,
 *   and among capped athletes, higher reps = lower encoded value = better rank.
 */
export function parseHybridScoreDisplay(
  scoreDisplay: string,
  totalReps: number,
  breakdown?: string
): HybridScoreResult | null {
  // Strip any scaled/foundations suffix (e.g., " - s" or " - f")
  let normalized = scoreDisplay.toLowerCase().trim();
  normalized = normalized.replace(/\s*-\s*[sf]$/, "");

  // Check for time format (finisher): "10:29"
  const timeMatch = normalized.match(/^(\d+):(\d{2})$/);
  if (timeMatch) {
    const seconds = parseInt(timeMatch[1], 10) * 60 + parseInt(timeMatch[2], 10);
    return {
      isFinisher: true,
      scorePrimaryRaw: seconds,
    };
  }

  // Check for reps format (capped): "158 reps" or just "158"
  const repsMatch = normalized.match(/^(\d+)\s*reps?$/);
  const numOnlyMatch = normalized.match(/^(\d+)$/);

  if (repsMatch || numOnlyMatch) {
    const reps = parseInt((repsMatch || numOnlyMatch)![1], 10);

    // Parse tiebreak from breakdown field if present
    // Breakdown format varies but often includes time like "6:45"
    let tiebreakSeconds: number | undefined;
    if (breakdown) {
      const tbMatch = breakdown.match(/(\d+):(\d{2})/);
      if (tbMatch) {
        tiebreakSeconds = parseInt(tbMatch[1], 10) * 60 + parseInt(tbMatch[2], 10);
      }
    }

    return {
      isFinisher: false,
      scorePrimaryRaw: reps,
      tiebreakSeconds,
    };
  }

  return null;
}

/**
 * Convert a hybrid score result to a sortable numeric value.
 * Lower value = better rank (for ASC sorting).
 *
 * - Finishers: their time in seconds (e.g., 542)
 * - Capped: baseOffset + (totalReps - reps) (e.g., 1000000 + 22 = 1000022 for 158/180 reps)
 *
 * This ensures:
 * 1. All finishers rank above all capped athletes
 * 2. Among finishers, lower time = better
 * 3. Among capped, higher reps = lower sortable value = better
 */
export function hybridScoreToSortable(
  result: HybridScoreResult,
  totalReps: number
): number {
  const CAPPED_OFFSET = 1000000; // Large offset to ensure capped are always after finishers

  if (result.isFinisher) {
    return result.scorePrimaryRaw; // Time in seconds
  } else {
    // For capped: offset + (totalReps - reps)
    // Higher reps = smaller difference = better rank
    return CAPPED_OFFSET + (totalReps - result.scorePrimaryRaw);
  }
}
