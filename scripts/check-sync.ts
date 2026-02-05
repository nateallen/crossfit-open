import { db, syncJobs, scores } from '../src/lib/db';
import { desc, sql } from 'drizzle-orm';

async function check() {
  const jobs = await db.select().from(syncJobs).orderBy(desc(syncJobs.id)).limit(10);
  console.log('\n=== SYNC JOBS ===');
  for (const job of jobs) {
    const progress = job.totalPages ? Math.round((job.currentPage! / job.totalPages) * 100) : 0;
    const scaledLabel = job.scaled === 0 ? 'RX' : job.scaled === 1 ? 'Scaled' : 'Foundations';
    console.log(`Job ${job.id}: ${job.year} Div${job.division} ${scaledLabel} - ${job.status} (${job.currentPage}/${job.totalPages}) ${progress}%`);
    if (job.error) console.log(`  Error: ${job.error}`);
  }

  const countResult = await db.select({ count: sql<number>`count(*)` }).from(scores);
  console.log(`\nTotal scores in DB: ${countResult[0].count}`);
}

check().catch(console.error);
