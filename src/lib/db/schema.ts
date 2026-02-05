import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";

// Competition metadata
export const competitions = sqliteTable("competitions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  year: integer("year").notNull(),
  type: text("type").default("open"),
  createdAt: integer("created_at", { mode: "timestamp" }),
});

// Workout definitions with scoring metadata
export const workouts = sqliteTable("workouts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  year: integer("year").notNull(),
  ordinal: integer("ordinal").notNull(), // 1, 2, 3, etc.
  name: text("name"), // "24.1", "24.2"
  scoreType: text("score_type").notNull(), // time, reps, rounds_reps, load
  timeCapSeconds: integer("time_cap_seconds"),
  repsPerRound: integer("reps_per_round"), // for rounds+reps calculation
  sortDirection: text("sort_direction").notNull(), // asc or desc
  tiebreakType: text("tiebreak_type"),
  description: text("description"),
});

// Athletes
export const athletes = sqliteTable("athletes", {
  competitorId: text("competitor_id").primaryKey(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  gender: text("gender"),
  countryCode: text("country_code"),
  affiliateName: text("affiliate_name"),
});

// Individual workout scores
export const scores = sqliteTable("scores", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  competitorId: text("competitor_id").notNull(),
  year: integer("year").notNull(),
  division: integer("division").notNull(),
  workoutOrdinal: integer("workout_ordinal").notNull(),
  rank: integer("rank"),
  scoreDisplay: text("score_display"),
  scorePrimaryRaw: integer("score_primary_raw"),
  scoreSecondaryRaw: integer("score_secondary_raw"),
}, (table) => [
  uniqueIndex("scores_unique_idx").on(
    table.competitorId,
    table.year,
    table.division,
    table.workoutOrdinal
  ),
]);

// Precomputed percentile buckets for fast lookup
export const percentileBuckets = sqliteTable("percentile_buckets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  year: integer("year").notNull(),
  division: integer("division").notNull(),
  workoutOrdinal: integer("workout_ordinal").notNull(),
  percentile: integer("percentile").notNull(), // 1-100
  lowerBound: integer("lower_bound").notNull(),
  upperBound: integer("upper_bound").notNull(),
  athleteCount: integer("athlete_count"),
});

// Sync job tracking
export const syncJobs = sqliteTable("sync_jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  year: integer("year").notNull(),
  division: integer("division").notNull(),
  status: text("status").default("pending"), // pending, running, completed, failed
  currentPage: integer("current_page").default(0),
  totalPages: integer("total_pages"),
  totalCompetitors: integer("total_competitors"),
  startedAt: integer("started_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  error: text("error"),
});

// Type exports for use throughout the app
export type Competition = typeof competitions.$inferSelect;
export type Workout = typeof workouts.$inferSelect;
export type Athlete = typeof athletes.$inferSelect;
export type Score = typeof scores.$inferSelect;
export type PercentileBucket = typeof percentileBuckets.$inferSelect;
export type SyncJob = typeof syncJobs.$inferSelect;
