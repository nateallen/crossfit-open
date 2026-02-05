import { NextRequest, NextResponse } from "next/server";
import { db, syncJobs } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, division } = body;

    // Validate inputs
    if (!year || !division) {
      return NextResponse.json(
        { error: "year and division are required" },
        { status: 400 }
      );
    }

    const yearNum = parseInt(year, 10);
    const divisionNum = parseInt(division, 10);

    if (yearNum < 2015 || yearNum > 2030) {
      return NextResponse.json(
        { error: "Invalid year" },
        { status: 400 }
      );
    }

    // Check if there's already a running sync job for this year/division
    const existingJobs = await db
      .select()
      .from(syncJobs)
      .where(
        and(
          eq(syncJobs.year, yearNum),
          eq(syncJobs.division, divisionNum),
          eq(syncJobs.status, "running")
        )
      );

    if (existingJobs.length > 0) {
      return NextResponse.json(
        {
          error: "Sync already in progress",
          jobId: existingJobs[0].id,
        },
        { status: 409 }
      );
    }

    // Create a new sync job using raw SQL to avoid Drizzle/Turso timestamp issues
    await db.run(sql`
      INSERT INTO sync_jobs (year, division, status, current_page, started_at)
      VALUES (${yearNum}, ${divisionNum}, 'running', 0, ${Math.floor(Date.now() / 1000)})
    `);

    // Get the job we just created
    const newJobs = await db
      .select()
      .from(syncJobs)
      .where(
        and(
          eq(syncJobs.year, yearNum),
          eq(syncJobs.division, divisionNum),
          eq(syncJobs.status, "running")
        )
      )
      .limit(1);

    const jobId = newJobs[0]?.id;

    return NextResponse.json({
      success: true,
      jobId,
      message: "Sync job started. Poll /api/sync/page to process pages.",
    });
  } catch (error) {
    console.error("Sync start error:", error);
    return NextResponse.json(
      { error: "Failed to start sync", details: String(error) },
      { status: 500 }
    );
  }
}
