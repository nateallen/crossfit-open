/**
 * API Route: Percentile Lookup
 *
 * POST /api/percentile-lookup
 *
 * This is the experimental anchor-based percentile lookup endpoint.
 * It estimates percentile without syncing all leaderboard data.
 *
 * Request body:
 * {
 *   year: number,          // Competition year (e.g., 2024)
 *   division: number,      // Division ID (1=Men, 2=Women)
 *   scaled: number,        // 0=RX, 1=Scaled, 2=Foundations (optional, default 0)
 *   workoutOrdinal: number, // Workout number (1, 2, 3, etc.)
 *   score: string,         // User's score (e.g., "10:30", "138", "7+12")
 *   tiebreak?: string      // Optional tiebreak time (e.g., "8:41")
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   percentile: number | null,      // 1-100
 *   percentileRange?: { best, worst },
 *   estimatedRank: number | null,
 *   rankRange?: { best, worst },
 *   totalCompetitors: number,
 *   matchType: "exact" | "bracket" | "error",
 *   apiCallsMade: number,
 *   debug?: { ... }                 // Debugging info
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { lookupPercentile } from "@/lib/percentile-lookup";
import { getWorkoutMetadata } from "@/lib/workout-metadata";

/**
 * Parse tiebreak time string (e.g., "8:41") to seconds.
 */
function parseTiebreakTime(tiebreak?: string): number | undefined {
  if (!tiebreak || typeof tiebreak !== "string") return undefined;

  const trimmed = tiebreak.trim();
  if (!trimmed) return undefined;

  // Match "M:SS" or "MM:SS" format
  const match = trimmed.match(/^(\d+):(\d{2})$/);
  if (!match) return undefined;

  const minutes = parseInt(match[1], 10);
  const seconds = parseInt(match[2], 10);

  if (isNaN(minutes) || isNaN(seconds)) return undefined;

  return minutes * 60 + seconds;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, division, scaled = 0, workoutOrdinal, score, tiebreak } = body;

    // Validate required fields
    if (!year || !division || !workoutOrdinal || !score) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: year, division, workoutOrdinal, score",
        },
        { status: 400 }
      );
    }

    // Validate year
    const yearNum = parseInt(String(year), 10);
    if (isNaN(yearNum) || yearNum < 2015 || yearNum > 2030) {
      return NextResponse.json(
        { success: false, error: "Invalid year" },
        { status: 400 }
      );
    }

    // Validate division
    const divisionNum = parseInt(String(division), 10);
    if (isNaN(divisionNum) || divisionNum < 1 || divisionNum > 25) {
      return NextResponse.json(
        { success: false, error: "Invalid division" },
        { status: 400 }
      );
    }

    // Validate scaled
    const scaledNum = parseInt(String(scaled), 10);
    if (isNaN(scaledNum) || scaledNum < 0 || scaledNum > 2) {
      return NextResponse.json(
        { success: false, error: "Invalid scaled value (0=RX, 1=Scaled, 2=Foundations)" },
        { status: 400 }
      );
    }

    // Validate workout ordinal
    const ordinalNum = parseInt(String(workoutOrdinal), 10);
    if (isNaN(ordinalNum) || ordinalNum < 1 || ordinalNum > 10) {
      return NextResponse.json(
        { success: false, error: "Invalid workoutOrdinal" },
        { status: 400 }
      );
    }

    // Get workout metadata
    const workout = getWorkoutMetadata(yearNum, ordinalNum);
    if (!workout) {
      return NextResponse.json(
        {
          success: false,
          error: `No workout metadata found for ${yearNum} workout ${ordinalNum}`,
        },
        { status: 400 }
      );
    }

    // Parse tiebreak if provided
    const tiebreakSeconds = parseTiebreakTime(tiebreak);

    // Perform lookup
    const result = await lookupPercentile(
      {
        year: yearNum,
        division: divisionNum,
        scaled: scaledNum,
        workoutOrdinal: ordinalNum,
        tiebreakSeconds,
      },
      String(score),
      workout
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Percentile lookup error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        percentile: null,
        estimatedRank: null,
        totalCompetitors: 0,
        matchType: "error",
        apiCallsMade: 0,
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler - returns usage information
 */
export async function GET() {
  return NextResponse.json({
    name: "Percentile Lookup API",
    description:
      "Experimental anchor-based percentile lookup. Estimates percentile without syncing all leaderboard data.",
    method: "POST",
    body: {
      year: "number (e.g., 2024)",
      division: "number (1=Men, 2=Women)",
      scaled: "number (0=RX, 1=Scaled, 2=Foundations) - optional, default 0",
      workoutOrdinal: "number (1, 2, 3, etc.)",
      score: "string (e.g., '10:30', '138', '7+12')",
      tiebreak: "string (e.g., '8:41') - optional, for precise ranking within ties",
    },
    example: {
      year: 2024,
      division: 1,
      scaled: 0,
      workoutOrdinal: 3,
      score: "138",
      tiebreak: "8:30",
    },
  });
}
