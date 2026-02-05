#!/usr/bin/env node
// Fast sync script using concurrent requests

const JOB_ID = process.argv[2] || 1;
const CONCURRENCY = parseInt(process.argv[3] || 10);
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function processPage(jobId) {
  const response = await fetch(`${BASE_URL}/api/sync/page`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId }),
  });
  return response.json();
}

async function getStatus(jobId) {
  const response = await fetch(`${BASE_URL}/api/sync/${jobId}/status`);
  return response.json();
}

async function main() {
  console.log(`Starting fast sync for job ${JOB_ID} with concurrency ${CONCURRENCY}`);

  let status = await getStatus(JOB_ID);
  console.log(`Initial: ${status.currentPage}/${status.totalPages} pages`);

  while (status.status === 'running') {
    // Process multiple pages concurrently
    const promises = [];
    for (let i = 0; i < CONCURRENCY; i++) {
      promises.push(processPage(JOB_ID));
    }

    const results = await Promise.all(promises);
    const lastResult = results[results.length - 1];

    if (lastResult.status !== 'running') {
      status = lastResult;
      break;
    }

    const pct = Math.round((lastResult.currentPage / lastResult.totalPages) * 100);
    process.stdout.write(`\rProgress: ${lastResult.currentPage}/${lastResult.totalPages} (${pct}%)`);

    status = lastResult;

    // Small delay to avoid overwhelming the server
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\nSync ${status.status}!`);
  if (status.status === 'completed') {
    console.log(`Total athletes synced: ${status.totalCompetitors}`);
  }
}

main().catch(console.error);
