import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
  // Add scaled column to scores table with default 0
  try {
    await client.execute('ALTER TABLE scores ADD COLUMN scaled INTEGER NOT NULL DEFAULT 0');
    console.log('✓ Added scaled column to scores table');
  } catch (e) {
    if (e.message.includes('duplicate column')) {
      console.log('✓ scaled column already exists in scores table');
    } else {
      console.error('✗ Error adding to scores:', e.message);
    }
  }

  // Add scaled column to sync_jobs table with default 0
  try {
    await client.execute('ALTER TABLE sync_jobs ADD COLUMN scaled INTEGER NOT NULL DEFAULT 0');
    console.log('✓ Added scaled column to sync_jobs table');
  } catch (e) {
    if (e.message.includes('duplicate column')) {
      console.log('✓ scaled column already exists in sync_jobs table');
    } else {
      console.error('✗ Error adding to sync_jobs:', e.message);
    }
  }

  // Drop and recreate the unique index to include scaled
  try {
    await client.execute('DROP INDEX IF EXISTS scores_unique_idx');
    console.log('✓ Dropped old unique index');
  } catch (e) {
    console.error('✗ Error dropping index:', e.message);
  }

  try {
    await client.execute('CREATE UNIQUE INDEX scores_unique_idx ON scores (competitor_id, year, division, workout_ordinal, scaled)');
    console.log('✓ Created new unique index with scaled column');
  } catch (e) {
    console.error('✗ Error creating index:', e.message);
  }

  console.log('\nSchema migration complete!');
}

migrate();
