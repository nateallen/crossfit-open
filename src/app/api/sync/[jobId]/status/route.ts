import { NextRequest, NextResponse } from "next/server";
import { db, syncJobs } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const jobIdNum = parseInt(jobId, 10);

    if (isNaN(jobIdNum)) {
      return NextResponse.json(
        { error: "Invalid job ID" },
        { status: 400 }
      );
    }

    const jobs = await db
      .select()
      .from(syncJobs)
      .where(eq(syncJobs.id, jobIdNum));

    if (jobs.length === 0) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const job = jobs[0];

    return NextResponse.json({
      id: job.id,
      year: job.year,
      division: job.division,
      status: job.status,
      currentPage: job.currentPage,
      totalPages: job.totalPages,
      totalCompetitors: job.totalCompetitors,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      error: job.error,
      progress:
        job.totalPages && job.totalPages > 0
          ? Math.round(((job.currentPage || 0) / job.totalPages) * 100)
          : 0,
    });
  } catch (error) {
    console.error("Sync status error:", error);
    return NextResponse.json(
      { error: "Failed to get status" },
      { status: 500 }
    );
  }
}
