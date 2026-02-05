import { NextRequest, NextResponse } from "next/server";
import { db, percentileBuckets, scores } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import { getWorkoutsForYear } from "@/lib/workout-metadata";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ year: string; division: string }> }
) {
  try {
    const { year, division } = await params;
    const yearNum = parseInt(year, 10);
    const divisionNum = parseInt(division, 10);

    if (isNaN(yearNum) || isNaN(divisionNum)) {
      return NextResponse.json(
        { error: "Invalid year or division" },
        { status: 400 }
      );
    }

    // Get existing percentile buckets
    const buckets = await db
      .select()
      .from(percentileBuckets)
      .where(
        and(
          eq(percentileBuckets.year, yearNum),
          eq(percentileBuckets.division, divisionNum)
        )
      );

    if (buckets.length === 0) {
      return NextResponse.json({
        percentiles: {},
        message: "No percentile data available. Run sync and compute first.",
      });
    }

    // Group by workout ordinal
    const grouped: Record<
      number,
      Array<{
        percentile: number;
        lowerBound: number;
        upperBound: number;
        athleteCount: number | null;
      }>
    > = {};

    for (const bucket of buckets) {
      if (!grouped[bucket.workoutOrdinal]) {
        grouped[bucket.workoutOrdinal] = [];
      }
      grouped[bucket.workoutOrdinal].push({
        percentile: bucket.percentile,
        lowerBound: bucket.lowerBound,
        upperBound: bucket.upperBound,
        athleteCount: bucket.athleteCount,
      });
    }

    return NextResponse.json({
      year: yearNum,
      division: divisionNum,
      percentiles: grouped,
    });
  } catch (error) {
    console.error("Percentiles GET error:", error);
    return NextResponse.json(
      { error: "Failed to get percentiles" },
      { status: 500 }
    );
  }
}

/**
 * POST to compute percentile buckets from synced score data
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ year: string; division: string }> }
) {
  try {
    const { year, division } = await params;
    const yearNum = parseInt(year, 10);
    const divisionNum = parseInt(division, 10);

    if (isNaN(yearNum) || isNaN(divisionNum)) {
      return NextResponse.json(
        { error: "Invalid year or division" },
        { status: 400 }
      );
    }

    // Get workout metadata to know sort direction
    const workouts = getWorkoutsForYear(yearNum);

    if (workouts.length === 0) {
      return NextResponse.json(
        { error: "No workout metadata for this year" },
        { status: 400 }
      );
    }

    // Delete existing percentile buckets for this year/division
    await db
      .delete(percentileBuckets)
      .where(
        and(
          eq(percentileBuckets.year, yearNum),
          eq(percentileBuckets.division, divisionNum)
        )
      );

    const computedWorkouts: number[] = [];

    for (const workout of workouts) {
      // Get all scores for this workout, including scaled type
      const workoutScores = await db
        .select({
          scorePrimaryRaw: scores.scorePrimaryRaw,
          scaled: scores.scaled,
        })
        .from(scores)
        .where(
          and(
            eq(scores.year, yearNum),
            eq(scores.division, divisionNum),
            eq(scores.workoutOrdinal, workout.ordinal)
          )
        );

      // Filter out null scores and separate by scaled type
      const rxScores: number[] = [];
      const scaledScores: number[] = [];
      const foundationsScores: number[] = [];

      for (const s of workoutScores) {
        if (s.scorePrimaryRaw === null) continue;

        if (s.scaled === 0) {
          rxScores.push(s.scorePrimaryRaw);
        } else if (s.scaled === 1) {
          scaledScores.push(s.scorePrimaryRaw);
        } else if (s.scaled === 2) {
          foundationsScores.push(s.scorePrimaryRaw);
        }
      }

      // Sort each group based on workout direction
      const sortFn = (a: number, b: number) =>
        workout.sortDirection === "asc" ? a - b : b - a;

      rxScores.sort(sortFn);
      scaledScores.sort(sortFn);
      foundationsScores.sort(sortFn);

      // Combine in proper order: RX first, then Scaled, then Foundations
      const validScores = [...rxScores, ...scaledScores, ...foundationsScores];

      if (validScores.length === 0) {
        continue;
      }

      const totalAthletes = validScores.length;

      // Compute percentile boundaries (1-100)
      const bucketInserts: Array<{
        year: number;
        division: number;
        workoutOrdinal: number;
        percentile: number;
        lowerBound: number;
        upperBound: number;
        athleteCount: number;
      }> = [];

      for (let p = 1; p <= 100; p++) {
        // Find the range of scores for this percentile
        // Top 1% means ranks 1 to 1% of total
        const startIdx = Math.floor(((p - 1) / 100) * totalAthletes);
        const endIdx = Math.floor((p / 100) * totalAthletes) - 1;

        const lowerBound = validScores[startIdx] || validScores[0];
        const upperBound =
          validScores[Math.min(endIdx, totalAthletes - 1)] ||
          validScores[totalAthletes - 1];

        bucketInserts.push({
          year: yearNum,
          division: divisionNum,
          workoutOrdinal: workout.ordinal,
          percentile: p,
          lowerBound,
          upperBound,
          athleteCount: totalAthletes,
        });
      }

      // Insert buckets
      if (bucketInserts.length > 0) {
        await db.insert(percentileBuckets).values(bucketInserts);
        computedWorkouts.push(workout.ordinal);
      }
    }

    return NextResponse.json({
      success: true,
      year: yearNum,
      division: divisionNum,
      workoutsComputed: computedWorkouts,
    });
  } catch (error) {
    console.error("Percentiles compute error:", error);
    return NextResponse.json(
      { error: "Failed to compute percentiles" },
      { status: 500 }
    );
  }
}
