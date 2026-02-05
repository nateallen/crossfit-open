/**
 * API Route: Overall Rank Lookup
 *
 * POST /api/overall-lookup
 *
 * Looks up overall rank by total points using the overall leaderboard (sort=0).
 *
 * Request body:
 * {
 *   year: number,          // Competition year (e.g., 2024)
 *   division: number,      // Division ID (1=Men, 2=Women)
 *   scaled: number,        // 0=RX, 1=Scaled, 2=Foundations (optional, default 0)
 *   totalPoints: number    // Sum of workout ranks
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   overallRank: number | null,
 *   overallPercentile: number | null,
 *   totalCompetitors: number,
 *   matchType: "exact" | "bracket" | "error",
 *   apiCallsMade: number,
 *   debug?: { ... }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { lookupOverallByPoints } from "@/lib/percentile-lookup";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, division, scaled = 0, totalPoints } = body;

    // Validate required fields
    if (!year || !division || totalPoints === undefined || totalPoints === null) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: year, division, totalPoints",
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
    if (isNaN(divisionNum) || divisionNum < 1 || divisionNum > 20) {
      return NextResponse.json(
        { success: false, error: "Invalid division" },
        { status: 400 }
      );
    }

    // Validate scaled
    const scaledNum = parseInt(String(scaled), 10);
    if (isNaN(scaledNum) || scaledNum < 0 || scaledNum > 2) {
      return NextResponse.json(
        { success: false, error: "Invalid scaled value" },
        { status: 400 }
      );
    }

    // Validate totalPoints
    const pointsNum = parseInt(String(totalPoints), 10);
    if (isNaN(pointsNum) || pointsNum < 1) {
      return NextResponse.json(
        { success: false, error: "Invalid totalPoints" },
        { status: 400 }
      );
    }

    // Perform lookup
    const result = await lookupOverallByPoints(
      {
        year: yearNum,
        division: divisionNum,
        scaled: scaledNum,
      },
      pointsNum
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Overall lookup error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        overallRank: null,
        overallPercentile: null,
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
    name: "Overall Rank Lookup API",
    description:
      "Looks up overall rank by total points using the overall leaderboard.",
    method: "POST",
    body: {
      year: "number (e.g., 2024)",
      division: "number (1=Men, 2=Women)",
      scaled: "number (0=RX, 1=Scaled, 2=Foundations) - optional, default 0",
      totalPoints: "number (sum of workout ranks)",
    },
    example: {
      year: 2024,
      division: 1,
      scaled: 0,
      totalPoints: 50000,
    },
  });
}
