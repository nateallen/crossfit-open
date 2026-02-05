import { NextRequest, NextResponse } from "next/server";
import { getWorkoutsForYear, getAvailableYears } from "@/lib/workout-metadata";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ year: string }> }
) {
  try {
    const { year } = await params;
    const yearNum = parseInt(year, 10);

    if (isNaN(yearNum)) {
      return NextResponse.json(
        { error: "Invalid year" },
        { status: 400 }
      );
    }

    const workouts = getWorkoutsForYear(yearNum);

    if (workouts.length === 0) {
      return NextResponse.json(
        {
          error: "No workout metadata for this year",
          availableYears: getAvailableYears(),
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      year: yearNum,
      workouts,
    });
  } catch (error) {
    console.error("Workouts API error:", error);
    return NextResponse.json(
      { error: "Failed to get workouts" },
      { status: 500 }
    );
  }
}
