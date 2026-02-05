import { NextRequest, NextResponse } from "next/server";
import { db, scores } from "@/lib/db";
import { sql, inArray } from "drizzle-orm";

/**
 * Admin endpoint to clean up duplicate scores.
 * Keeps only one record per (competitorId, year, division, workoutOrdinal).
 */
export async function POST(request: NextRequest) {
  try {
    // First, count total scores and unique combinations
    const countResult = await db
      .select({
        total: sql<number>`COUNT(*)`,
        unique: sql<number>`COUNT(DISTINCT competitor_id || '-' || year || '-' || division || '-' || workout_ordinal)`,
      })
      .from(scores);

    const totalScores = Number(countResult[0]?.total) || 0;
    const uniqueScores = Number(countResult[0]?.unique) || 0;
    const duplicates = totalScores - uniqueScores;

    if (duplicates === 0) {
      return NextResponse.json({
        message: "No duplicates found",
        totalScores,
        uniqueScores,
      });
    }

    // Approach: Get IDs to KEEP (max ID per group), then delete everything else
    // Fetch in batches due to Turso limitations
    const idsToKeep = await db.all<{ id: number }>(sql`
      SELECT MAX(id) as id
      FROM scores
      GROUP BY competitor_id, year, division, workout_ordinal
    `);

    const keepIds = new Set(idsToKeep.map((r) => r.id));

    // Now get all IDs and find ones to delete
    // Do this in batches
    const BATCH_SIZE = 10000;
    let deletedCount = 0;
    let offset = 0;

    while (true) {
      const batch = await db
        .select({ id: scores.id })
        .from(scores)
        .limit(BATCH_SIZE)
        .offset(offset);

      if (batch.length === 0) break;

      const idsToDelete = batch
        .map((r) => r.id)
        .filter((id) => id !== null && !keepIds.has(id));

      if (idsToDelete.length > 0) {
        // Delete in smaller chunks to avoid query size limits
        const CHUNK_SIZE = 500;
        for (let i = 0; i < idsToDelete.length; i += CHUNK_SIZE) {
          const chunk = idsToDelete.slice(i, i + CHUNK_SIZE);
          await db.delete(scores).where(inArray(scores.id, chunk as number[]));
          deletedCount += chunk.length;
        }
      }

      offset += BATCH_SIZE;

      // If we've processed all records
      if (batch.length < BATCH_SIZE) break;
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned ${deletedCount} duplicate records`,
      before: {
        totalScores,
        uniqueScores,
        duplicates,
      },
      after: {
        totalScores: totalScores - deletedCount,
      },
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      { error: "Failed to cleanup duplicates", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET to check duplicate status without cleaning
 */
export async function GET(request: NextRequest) {
  try {
    const countResult = await db
      .select({
        total: sql<number>`COUNT(*)`,
        unique: sql<number>`COUNT(DISTINCT competitor_id || '-' || year || '-' || division || '-' || workout_ordinal)`,
      })
      .from(scores);

    const totalScores = Number(countResult[0]?.total) || 0;
    const uniqueScores = Number(countResult[0]?.unique) || 0;
    const duplicates = totalScores - uniqueScores;

    return NextResponse.json({
      totalScores,
      uniqueScores,
      duplicates,
      hasDuplicates: duplicates > 0,
    });
  } catch (error) {
    console.error("Cleanup check error:", error);
    return NextResponse.json(
      { error: "Failed to check duplicates" },
      { status: 500 }
    );
  }
}
