import { NextRequest, NextResponse } from "next/server";
import { db, scores, syncJobs, percentileBuckets } from "@/lib/db";
import { sql, eq } from "drizzle-orm";

/**
 * Admin endpoint to reset sync data for a fresh start.
 * Deletes all scores and percentile buckets for a year/division.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, division, confirmReset } = body;

    if (!confirmReset) {
      return NextResponse.json(
        { error: "Must set confirmReset: true to proceed" },
        { status: 400 }
      );
    }

    const yearNum = parseInt(year, 10);
    const divisionNum = parseInt(division, 10);

    if (isNaN(yearNum) || isNaN(divisionNum)) {
      return NextResponse.json(
        { error: "Invalid year or division" },
        { status: 400 }
      );
    }

    // Count existing records
    const scoreCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(scores);

    // Delete all scores for this year/division
    await db.delete(scores).where(
      sql`year = ${yearNum} AND division = ${divisionNum}`
    );

    // Delete percentile buckets
    await db.delete(percentileBuckets).where(
      sql`year = ${yearNum} AND division = ${divisionNum}`
    );

    // Mark any running sync jobs as failed
    await db
      .update(syncJobs)
      .set({ status: "failed", error: "Reset by admin" })
      .where(
        sql`year = ${yearNum} AND division = ${divisionNum} AND status = 'running'`
      );

    return NextResponse.json({
      success: true,
      message: `Reset complete for ${year} division ${division}`,
      deletedScoresBefore: scoreCount[0]?.count || 0,
    });
  } catch (error) {
    console.error("Reset error:", error);
    return NextResponse.json(
      { error: "Failed to reset", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE all scores (nuclear option)
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { confirmDelete } = body;

    if (confirmDelete !== "DELETE_ALL_SCORES") {
      return NextResponse.json(
        { error: "Must set confirmDelete: 'DELETE_ALL_SCORES' to proceed" },
        { status: 400 }
      );
    }

    // Count before delete
    const beforeCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(scores);

    // Delete all scores
    await db.delete(scores);

    // Delete all percentile buckets
    await db.delete(percentileBuckets);

    // Mark all sync jobs as failed
    await db
      .update(syncJobs)
      .set({ status: "failed", error: "All data deleted by admin" })
      .where(eq(syncJobs.status, "running"));

    return NextResponse.json({
      success: true,
      message: "All scores and percentile data deleted",
      deletedScores: beforeCount[0]?.count || 0,
    });
  } catch (error) {
    console.error("Delete all error:", error);
    return NextResponse.json(
      { error: "Failed to delete all", details: String(error) },
      { status: 500 }
    );
  }
}
