import { NextRequest, NextResponse } from "next/server";
import { db, syncJobs, athletes, scores } from "@/lib/db";
import { eq } from "drizzle-orm";
import type { LeaderboardResponse } from "@/types";
import {
  parseScoreDisplay,
  parseHybridScoreDisplay,
  hybridScoreToSortable,
} from "@/lib/score-parser";
import { getWorkoutMetadata, inferScoreType } from "@/lib/workout-metadata";

const CROSSFIT_API_BASE =
  "https://c3po.crossfit.com/api/competitions/v2/competitions/open";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: "jobId is required" },
        { status: 400 }
      );
    }

    // Get the sync job
    const jobs = await db
      .select()
      .from(syncJobs)
      .where(eq(syncJobs.id, jobId));

    if (jobs.length === 0) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const job = jobs[0];

    if (job.status === "completed") {
      return NextResponse.json({
        status: "completed",
        message: "Sync already completed",
        currentPage: job.currentPage,
        totalPages: job.totalPages,
      });
    }

    if (job.status === "failed") {
      return NextResponse.json({
        status: "failed",
        error: job.error,
      });
    }

    // Fetch the next page
    const nextPage = (job.currentPage || 0) + 1;

    const url = new URL(`${CROSSFIT_API_BASE}/${job.year}/leaderboards`);
    url.searchParams.set("view", "0");
    url.searchParams.set("division", job.division.toString());
    url.searchParams.set("scaled", "0");
    url.searchParams.set("page", nextPage.toString());
    url.searchParams.set("region", "0");
    url.searchParams.set("sort", "0");

    const response = await fetch(url.toString());

    if (!response.ok) {
      // Mark job as failed
      await db
        .update(syncJobs)
        .set({
          status: "failed",
          error: `API error: ${response.status}`,
        })
        .where(eq(syncJobs.id, jobId));

      return NextResponse.json(
        { error: `API error: ${response.status}` },
        { status: 502 }
      );
    }

    const data = (await response.json()) as LeaderboardResponse;

    // Process athletes and scores from this page
    const athleteInserts: Array<{
      competitorId: string;
      firstName: string | null;
      lastName: string | null;
      gender: string | null;
      countryCode: string | null;
      affiliateName: string | null;
    }> = [];

    const scoreInserts: Array<{
      competitorId: string;
      year: number;
      division: number;
      workoutOrdinal: number;
      rank: number | null;
      scoreDisplay: string | null;
      scorePrimaryRaw: number | null;
    }> = [];

    for (const row of data.leaderboardRows) {
      const entrant = row.entrant;

      // Prepare athlete data
      athleteInserts.push({
        competitorId: entrant.competitorId,
        firstName: entrant.firstName || null,
        lastName: entrant.lastName || null,
        gender: entrant.gender || null,
        countryCode: entrant.countryOfOriginCode || null,
        affiliateName: entrant.affiliateName || null,
      });

      // Prepare score data
      for (const score of row.scores) {
        // Get workout metadata to determine score type
        const workoutMeta = getWorkoutMetadata(job.year, score.ordinal);
        const isHybrid =
          workoutMeta?.scoreType === "time" && workoutMeta?.cappedScoreType === "reps";

        let scorePrimaryRaw: number | null = null;
        let scoreSecondaryRaw: number | null = null;

        if (isHybrid && workoutMeta?.totalReps) {
          // Parse hybrid score (time for finishers, reps for capped)
          const hybridResult = parseHybridScoreDisplay(
            score.scoreDisplay,
            workoutMeta.totalReps,
            score.breakdown
          );
          if (hybridResult) {
            // Use sortable value for ranking
            scorePrimaryRaw = hybridScoreToSortable(hybridResult, workoutMeta.totalReps);
            // Store tiebreak as secondary
            scoreSecondaryRaw = hybridResult.tiebreakSeconds || null;
          }
        } else {
          // Standard single score type
          const scoreType = workoutMeta?.scoreType || inferScoreType(score.scoreDisplay);
          scorePrimaryRaw = parseScoreDisplay(score.scoreDisplay, scoreType);
        }

        scoreInserts.push({
          competitorId: entrant.competitorId,
          year: job.year,
          division: job.division,
          workoutOrdinal: score.ordinal,
          rank: score.rank ? parseInt(score.rank, 10) : null,
          scoreDisplay: score.scoreDisplay || null,
          scorePrimaryRaw,
        });
      }
    }

    // Batch insert athletes (upsert)
    if (athleteInserts.length > 0) {
      for (const athlete of athleteInserts) {
        await db
          .insert(athletes)
          .values(athlete)
          .onConflictDoUpdate({
            target: athletes.competitorId,
            set: {
              firstName: athlete.firstName,
              lastName: athlete.lastName,
              gender: athlete.gender,
              countryCode: athlete.countryCode,
              affiliateName: athlete.affiliateName,
            },
          });
      }
    }

    // Batch insert scores (skip duplicates via unique constraint)
    if (scoreInserts.length > 0) {
      await db
        .insert(scores)
        .values(scoreInserts)
        .onConflictDoNothing();
    }

    // Update job progress
    const isComplete = nextPage >= data.pagination.totalPages;

    await db
      .update(syncJobs)
      .set({
        currentPage: nextPage,
        totalPages: data.pagination.totalPages,
        totalCompetitors: data.pagination.totalCompetitors,
        status: isComplete ? "completed" : "running",
        completedAt: isComplete ? new Date() : null,
      })
      .where(eq(syncJobs.id, jobId));

    return NextResponse.json({
      status: isComplete ? "completed" : "running",
      currentPage: nextPage,
      totalPages: data.pagination.totalPages,
      totalCompetitors: data.pagination.totalCompetitors,
      athletesProcessed: athleteInserts.length,
      scoresProcessed: scoreInserts.length,
    });
  } catch (error) {
    console.error("Sync page error:", error);
    return NextResponse.json(
      { error: "Failed to process page" },
      { status: 500 }
    );
  }
}
