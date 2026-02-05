import { NextRequest, NextResponse } from "next/server";
import { db, percentileBuckets, scores } from "@/lib/db";
import { eq, and } from "drizzle-orm";
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

    // Group by workout ordinal, then by scaled type
    const grouped: Record<
      number,
      {
        byScaled: Record<number, Array<{
          percentile: number;
          lowerBound: number;
          upperBound: number;
        }>>;
        counts: {
          rx: number;
          scaled: number;
          foundations: number;
          total: number;
        };
      }
    > = {};

    for (const bucket of buckets) {
      if (!grouped[bucket.workoutOrdinal]) {
        grouped[bucket.workoutOrdinal] = {
          byScaled: { 0: [], 1: [], 2: [] },
          counts: { rx: 0, scaled: 0, foundations: 0, total: 0 },
        };
      }

      const scaledType = bucket.scaled ?? 0;

      if (!grouped[bucket.workoutOrdinal].byScaled[scaledType]) {
        grouped[bucket.workoutOrdinal].byScaled[scaledType] = [];
      }

      grouped[bucket.workoutOrdinal].byScaled[scaledType].push({
        percentile: bucket.percentile,
        lowerBound: bucket.lowerBound,
        upperBound: bucket.upperBound,
      });

      // Set counts from first bucket of each type
      if (bucket.percentile === 1) {
        if (scaledType === 0) {
          grouped[bucket.workoutOrdinal].counts.rx = bucket.athleteCount || 0;
        } else if (scaledType === 1) {
          grouped[bucket.workoutOrdinal].counts.scaled = bucket.athleteCount || 0;
        } else if (scaledType === 2) {
          grouped[bucket.workoutOrdinal].counts.foundations = bucket.athleteCount || 0;
        }
        grouped[bucket.workoutOrdinal].counts.total = bucket.totalAthleteCount || 0;
      }
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
 * Computes separate buckets for RX, Scaled, and Foundations
 * so frontend can calculate overall percentile with hierarchy:
 * RX (best) > Scaled > Foundations (worst)
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
    const stats: Record<number, { rx: number; scaled: number; foundations: number; total: number }> = {};

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

      // Sort each group based on workout direction (best scores first)
      const sortFn = (a: number, b: number) =>
        workout.sortDirection === "asc" ? a - b : b - a;

      rxScores.sort(sortFn);
      scaledScores.sort(sortFn);
      foundationsScores.sort(sortFn);

      const totalAthletes = rxScores.length + scaledScores.length + foundationsScores.length;

      if (totalAthletes === 0) {
        continue;
      }

      stats[workout.ordinal] = {
        rx: rxScores.length,
        scaled: scaledScores.length,
        foundations: foundationsScores.length,
        total: totalAthletes,
      };

      // Compute percentile buckets for each scaled type separately
      const allBucketInserts: Array<{
        year: number;
        division: number;
        workoutOrdinal: number;
        scaled: number;
        percentile: number;
        lowerBound: number;
        upperBound: number;
        athleteCount: number;
        totalAthleteCount: number;
      }> = [];

      const scoreGroups = [
        { scaled: 0, scores: rxScores },
        { scaled: 1, scores: scaledScores },
        { scaled: 2, scores: foundationsScores },
      ];

      for (const { scaled, scores: groupScores } of scoreGroups) {
        if (groupScores.length === 0) continue;

        const groupCount = groupScores.length;

        for (let p = 1; p <= 100; p++) {
          // Find the range of scores for this percentile within this scaled type
          const startIdx = Math.floor(((p - 1) / 100) * groupCount);
          const endIdx = Math.floor((p / 100) * groupCount) - 1;

          const lowerBound = groupScores[startIdx] || groupScores[0];
          const upperBound =
            groupScores[Math.min(endIdx, groupCount - 1)] ||
            groupScores[groupCount - 1];

          allBucketInserts.push({
            year: yearNum,
            division: divisionNum,
            workoutOrdinal: workout.ordinal,
            scaled,
            percentile: p,
            lowerBound,
            upperBound,
            athleteCount: groupCount,
            totalAthleteCount: totalAthletes,
          });
        }
      }

      // Insert buckets in batches
      if (allBucketInserts.length > 0) {
        // Insert in smaller batches to avoid hitting limits
        const batchSize = 100;
        for (let i = 0; i < allBucketInserts.length; i += batchSize) {
          const batch = allBucketInserts.slice(i, i + batchSize);
          await db.insert(percentileBuckets).values(batch);
        }
        computedWorkouts.push(workout.ordinal);
      }
    }

    return NextResponse.json({
      success: true,
      year: yearNum,
      division: divisionNum,
      workoutsComputed: computedWorkouts,
      stats,
    });
  } catch (error) {
    console.error("Percentiles compute error:", error);
    return NextResponse.json(
      { error: "Failed to compute percentiles" },
      { status: 500 }
    );
  }
}
