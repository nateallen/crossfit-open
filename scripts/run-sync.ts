// Run sync jobs by polling the page endpoint
import { db, syncJobs, scores, athletes } from '../src/lib/db';
import { eq, and, sql, desc } from 'drizzle-orm';

const CROSSFIT_API_BASE = "https://c3po.crossfit.com/api/leaderboards/v2/competitions/open";

interface LeaderboardRow {
  entrant: {
    competitorId: string;
    competitorName: string;
    countryOfOriginCode: string;
    regionId: string;
    affiliateId?: string;
    affiliateName?: string;
  };
  scores: Array<{
    ordinal: number;
    rank?: string;
    scoreDisplay?: string;
    scaled?: boolean;
    time?: string;
    breakdown?: string;
  }>;
}

function parseScoreDisplay(scoreDisplay: string, scoreType?: string): number | null {
  if (!scoreDisplay || scoreDisplay === '-' || scoreDisplay === '--') return null;

  // Time format: "MM:SS" or "HH:MM:SS"
  const timeMatch = scoreDisplay.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (timeMatch) {
    const [, first, second, third] = timeMatch;
    if (third) {
      // HH:MM:SS
      return parseInt(first) * 3600 + parseInt(second) * 60 + parseInt(third);
    }
    // MM:SS
    return parseInt(first) * 60 + parseInt(second);
  }

  // Reps or load: just a number possibly with "reps" or "lb" suffix
  const numMatch = scoreDisplay.match(/^([\d,]+)/);
  if (numMatch) {
    return parseInt(numMatch[1].replace(/,/g, ''));
  }

  return null;
}

async function processPage(jobId: number) {
  const [job] = await db.select().from(syncJobs).where(eq(syncJobs.id, jobId));

  if (!job || job.status !== 'running') {
    return { done: true, status: job?.status || 'not found' };
  }

  const nextPage = (job.currentPage || 0) + 1;
  const scaledValue = job.scaled ?? 0;

  const url = new URL(`${CROSSFIT_API_BASE}/${job.year}/leaderboards`);
  url.searchParams.set("view", "0");
  url.searchParams.set("division", job.division.toString());
  url.searchParams.set("scaled", scaledValue.toString());
  url.searchParams.set("page", nextPage.toString());
  url.searchParams.set("region", "0");
  url.searchParams.set("sort", "0");

  const response = await fetch(url.toString());

  if (!response.ok) {
    await db.update(syncJobs)
      .set({ status: 'failed', error: `HTTP ${response.status}` })
      .where(eq(syncJobs.id, jobId));
    return { done: true, status: 'failed' };
  }

  const data = await response.json();
  const totalPages = data.pagination?.totalPages || 0;

  if (!data.leaderboardRows || data.leaderboardRows.length === 0) {
    await db.update(syncJobs)
      .set({ status: 'completed', totalPages })
      .where(eq(syncJobs.id, jobId));
    return { done: true, status: 'completed' };
  }

  // Process athletes and scores
  const athleteInserts: Array<{
    competitorId: string;
    competitorName: string;
    countryCode: string;
    regionId: string;
    affiliateId: string | null;
    affiliateName: string | null;
  }> = [];

  const scoreInserts: Array<{
    competitorId: string;
    year: number;
    division: number;
    workoutOrdinal: number;
    scaled: number;
    rank: number | null;
    scoreDisplay: string | null;
    scorePrimaryRaw: number | null;
  }> = [];

  for (const row of data.leaderboardRows as LeaderboardRow[]) {
    const entrant = row.entrant;

    athleteInserts.push({
      competitorId: entrant.competitorId,
      competitorName: entrant.competitorName,
      countryCode: entrant.countryOfOriginCode,
      regionId: entrant.regionId,
      affiliateId: entrant.affiliateId || null,
      affiliateName: entrant.affiliateName || null,
    });

    for (const score of row.scores) {
      let scorePrimaryRaw: number | null = null;
      const scoreType = score.time ? 'time' : 'reps';

      if (score.scoreDisplay) {
        scorePrimaryRaw = parseScoreDisplay(score.scoreDisplay, scoreType);
      }

      scoreInserts.push({
        competitorId: entrant.competitorId,
        year: job.year,
        division: job.division,
        workoutOrdinal: score.ordinal,
        scaled: scaledValue,
        rank: score.rank ? parseInt(score.rank, 10) : null,
        scoreDisplay: score.scoreDisplay || null,
        scorePrimaryRaw,
      });
    }
  }

  // Batch insert athletes
  if (athleteInserts.length > 0) {
    await db.insert(athletes)
      .values(athleteInserts)
      .onConflictDoUpdate({
        target: athletes.competitorId,
        set: {
          competitorName: sql`excluded.competitor_name`,
          countryCode: sql`excluded.country_code`,
          regionId: sql`excluded.region_id`,
          affiliateId: sql`excluded.affiliate_id`,
          affiliateName: sql`excluded.affiliate_name`,
        },
      });
  }

  // Batch insert scores
  if (scoreInserts.length > 0) {
    await db.insert(scores)
      .values(scoreInserts)
      .onConflictDoUpdate({
        target: [scores.competitorId, scores.year, scores.division, scores.workoutOrdinal, scores.scaled],
        set: {
          rank: sql`excluded.rank`,
          scoreDisplay: sql`excluded.score_display`,
          scorePrimaryRaw: sql`excluded.score_primary_raw`,
        },
      });
  }

  // Update job progress
  await db.update(syncJobs)
    .set({ currentPage: nextPage, totalPages })
    .where(eq(syncJobs.id, jobId));

  return {
    done: false,
    page: nextPage,
    totalPages,
    athletes: athleteInserts.length,
    scores: scoreInserts.length,
  };
}

async function runAllJobs() {
  // Get all running jobs
  const runningJobs = await db.select()
    .from(syncJobs)
    .where(eq(syncJobs.status, 'running'));

  console.log(`Found ${runningJobs.length} running jobs`);

  for (const job of runningJobs) {
    const scaledLabel = job.scaled === 0 ? 'RX' : job.scaled === 1 ? 'Scaled' : 'Foundations';
    console.log(`\nProcessing Job ${job.id}: ${job.year} Div${job.division} ${scaledLabel}`);

    let done = false;
    while (!done) {
      try {
        const result = await processPage(job.id);
        done = result.done;

        if (!done) {
          const progress = result.totalPages ? Math.round((result.page! / result.totalPages) * 100) : 0;
          process.stdout.write(`\r  Page ${result.page}/${result.totalPages} (${progress}%) - ${result.athletes} athletes, ${result.scores} scores`);
        } else {
          console.log(`\n  Status: ${result.status}`);
        }
      } catch (error) {
        console.error(`\n  Error:`, error);
        done = true;
      }
    }
  }

  // Show final stats
  const countResult = await db.select({ count: sql<number>`count(*)` }).from(scores);
  console.log(`\nTotal scores in DB: ${countResult[0].count}`);
}

runAllJobs().catch(console.error);
