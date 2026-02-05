"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkoutCard } from "@/components/simulator/WorkoutCard";
import { ResultsPanel } from "@/components/simulator/ResultsPanel";
import { DistributionChart } from "@/components/simulator/DistributionChart";
import { Header } from "@/components/Header";
import type { WorkoutMetadata, ParsedScore, UserScore, DivisionId } from "@/types";
import { DIVISIONS } from "@/types";
import { getWorkoutsForYear, getAvailableYears } from "@/lib/workout-metadata";

export default function SimulatorPage() {
  const [year, setYear] = useState(2024);
  const [division, setDivision] = useState<DivisionId>(DIVISIONS.MEN);
  const [scores, setScores] = useState<Record<number, UserScore>>({});
  const [activeWorkout, setActiveWorkout] = useState<number | null>(null);
  const [percentileBuckets, setPercentileBuckets] = useState<
    Record<number, Array<{
      percentile: number;
      lowerBound: number;
      upperBound: number;
      athleteCount: number | null;
    }>>
  >({});
  const [totalAthletes, setTotalAthletes] = useState<number | null>(null);

  const availableYears = getAvailableYears();
  const workouts = getWorkoutsForYear(year);

  // Fetch percentile data when year/division changes
  useEffect(() => {
    const fetchPercentiles = async () => {
      try {
        const response = await fetch(`/api/percentiles/${year}/${division}`);
        if (response.ok) {
          const data = await response.json();
          setPercentileBuckets(data.percentiles || {});
          // Get total athletes from first bucket
          const firstWorkoutBuckets = Object.values(data.percentiles || {})[0] as
            | Array<{ athleteCount: number | null }>
            | undefined;
          if (firstWorkoutBuckets?.[0]?.athleteCount) {
            setTotalAthletes(firstWorkoutBuckets[0].athleteCount);
          }
        }
      } catch (error) {
        console.error("Failed to fetch percentiles:", error);
      }
    };

    fetchPercentiles();
  }, [year, division]);

  // Reset scores when year changes
  useEffect(() => {
    setScores({});
    setActiveWorkout(workouts[0]?.ordinal || null);
  }, [year]);

  // Recalculate percentiles when buckets are loaded or updated
  useEffect(() => {
    if (Object.keys(percentileBuckets).length === 0) return;

    setScores((prev) => {
      const updated = { ...prev };
      for (const [ordinalStr, score] of Object.entries(prev)) {
        const ordinal = parseInt(ordinalStr, 10);
        if (!score.parsed?.isValid) continue;

        const workoutBuckets = percentileBuckets[ordinal] || [];
        if (workoutBuckets.length === 0) continue;

        const workout = workouts.find((w) => w.ordinal === ordinal);
        const isAsc = workout?.sortDirection === "asc";

        let percentile: number | null = null;
        let estimatedRank: number | null = null;

        for (const bucket of workoutBuckets) {
          const inRange = isAsc
            ? score.parsed.scorePrimaryRaw <= bucket.upperBound
            : score.parsed.scorePrimaryRaw >= bucket.lowerBound;

          if (inRange) {
            percentile = bucket.percentile;
            if (bucket.athleteCount) {
              estimatedRank = Math.round(
                (bucket.percentile / 100) * bucket.athleteCount
              );
            }
            break;
          }
        }

        // Handle scores outside our data range
        if (percentile === null && workoutBuckets.length > 0) {
          const lastBucket = workoutBuckets[workoutBuckets.length - 1];
          percentile = 100;
          if (lastBucket.athleteCount) {
            estimatedRank = lastBucket.athleteCount;
          }
        }

        updated[ordinal] = {
          ...score,
          percentile,
          estimatedRank,
        };
      }
      return updated;
    });
  }, [percentileBuckets, workouts]);

  const handleScoreChange = useCallback(
    (ordinal: number, value: string, parsed: ParsedScore | null) => {
      // Use functional update to avoid stale closure issues
      setScores((prev) => {
        // Calculate percentile from parsed score
        let percentile: number | null = null;
        let estimatedRank: number | null = null;

        const workoutBuckets = percentileBuckets[ordinal] || [];

        if (parsed?.isValid && workoutBuckets.length > 0) {
          const workout = workouts.find((w) => w.ordinal === ordinal);
          const isAsc = workout?.sortDirection === "asc";

          // Find the matching bucket
          for (const bucket of workoutBuckets) {
            let inRange: boolean;

            if (isAsc) {
              // For time (lower is better): score should be <= upperBound
              inRange = parsed.scorePrimaryRaw <= bucket.upperBound;
            } else {
              // For reps/load (higher is better): score should be >= lowerBound
              // Note: lowerBound is the higher score for desc sorts
              inRange = parsed.scorePrimaryRaw >= bucket.lowerBound;
            }

            if (inRange) {
              percentile = bucket.percentile;
              if (bucket.athleteCount) {
                estimatedRank = Math.round(
                  (bucket.percentile / 100) * bucket.athleteCount
                );
              }
              break;
            }
          }

          // If no bucket matched, the score is outside our data range
          // For DESC sorts, a low score means worse than our worst recorded
          // For ASC sorts, a high score means worse than our worst recorded
          if (percentile === null && workoutBuckets.length > 0) {
            const lastBucket = workoutBuckets[workoutBuckets.length - 1];
            percentile = 100; // Bottom percentile
            if (lastBucket.athleteCount) {
              estimatedRank = lastBucket.athleteCount;
            }
          }
        }

        return {
          ...prev,
          [ordinal]: {
            input: value,
            parsed,
            percentile,
            estimatedRank,
          },
        };
      });
    },
    [percentileBuckets, workouts]
  );

  const activeWorkoutData = workouts.find((w) => w.ordinal === activeWorkout);
  const activeScore = activeWorkout ? scores[activeWorkout] : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Year/Division Selectors */}
      <div className="container mx-auto px-4 py-4 flex gap-4">
        <Select
          value={String(year)}
          onValueChange={(val) => setYear(parseInt(val, 10))}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y} Open
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(division)}
          onValueChange={(val) => setDivision(parseInt(val, 10) as DivisionId)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select division" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={String(DIVISIONS.MEN)}>Men (RX)</SelectItem>
            <SelectItem value={String(DIVISIONS.WOMEN)}>Women (RX)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Workout Cards */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold">Workout Scores</h2>
            {workouts.map((workout) => {
              const score = scores[workout.ordinal] || {
                input: "",
                parsed: null,
                percentile: null,
                estimatedRank: null,
              };

              return (
                <WorkoutCard
                  key={workout.ordinal}
                  workout={workout}
                  value={score.input}
                  onChange={(value, parsed) =>
                    handleScoreChange(workout.ordinal, value, parsed)
                  }
                  percentile={score.percentile}
                  estimatedRank={score.estimatedRank}
                  totalAthletes={totalAthletes}
                  isActive={activeWorkout === workout.ordinal}
                  onFocus={() => setActiveWorkout(workout.ordinal)}
                />
              );
            })}
          </div>

          {/* Right Column - Results Panel */}
          <div className="space-y-4">
            <ResultsPanel
              year={year}
              workouts={workouts}
              scores={scores}
              totalAthletes={totalAthletes}
            />

            {/* Distribution Chart */}
            <DistributionChart
              workout={activeWorkoutData || null}
              userScore={activeScore?.parsed?.scorePrimaryRaw || null}
              percentileBuckets={
                activeWorkout ? percentileBuckets[activeWorkout] || null : null
              }
            />
          </div>
        </div>
      </main>
    </div>
  );
}
