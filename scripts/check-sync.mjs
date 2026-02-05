import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const result = await client.execute('SELECT id, year, division, scaled, status, current_page, total_pages, total_competitors, started_at, completed_at FROM sync_jobs ORDER BY id DESC LIMIT 10');

console.log('Sync Jobs Status:');
console.log('─'.repeat(80));

if (result.rows.length === 0) {
  console.log('No sync jobs found.');
} else {
  for (const row of result.rows) {
    const progress = row.total_pages ? Math.round((row.current_page / row.total_pages) * 100) : 0;
    const scaledLabel = row.scaled === 0 ? 'RX' : row.scaled === 1 ? 'Scaled' : row.scaled === 2 ? 'Foundations' : 'RX';
    const divisionLabel = row.division === 1 ? 'Men' : row.division === 2 ? 'Women' : `Div ${row.division}`;
    console.log(`Job ${row.id}: Year ${row.year}, ${divisionLabel} ${scaledLabel}`);
    console.log(`  Status: ${row.status}`);
    console.log(`  Progress: ${row.current_page}/${row.total_pages} pages (${progress}%)`);
    console.log(`  Total Competitors: ${row.total_competitors || 'N/A'}`);
    console.log(`  Started: ${row.started_at ? new Date(row.started_at * 1000).toLocaleString() : 'N/A'}`);
    console.log(`  Completed: ${row.completed_at ? new Date(row.completed_at * 1000).toLocaleString() : 'N/A'}`);
    console.log('─'.repeat(80));
  }
}
