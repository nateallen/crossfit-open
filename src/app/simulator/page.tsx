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
import { Header } from "@/components/Header";
import type { WorkoutMetadata, ParsedScore, UserScore, DivisionId } from "@/types";
import { DIVISIONS } from "@/types";
import { getWorkoutsForYear, getAvailableYears } from "@/lib/workout-metadata";

// New percentile data structure with hierarchy support
interface WorkoutPercentileData {
  byScaled: Record<number, Array<{
    percentile: number;
    lowerBound: number;
    upperBound: number;
  }>>;
  counts: {
    rx: number;
    scaled: number;
    foundations: number;
    total: number;
  };
}

type PercentileDataMap = Record<number, WorkoutPercentileData>;

// Currently we only support RX score entry (scaled=0)
const USER_SCALED_TYPE = 0;

/**
 * Calculate overall percentile for an RX score using the hierarchy:
 * RX (best) > Scaled > Foundations (worst)
 *
 * An RX athlete's overall rank is their rank within RX.
 * Overall percentile = (rank within RX) / (total athletes) * 100
 */
function calculateOverallPercentile(
  percentileWithinType: number,
  counts: WorkoutPercentileData["counts"],
  scaledType: number
): { overallPercentile: number; estimatedRank: number } {
  let rankWithinTotal: number;

  if (scaledType === 0) {
    // RX: rank is just their position within RX
    rankWithinTotal = Math.round((percentileWithinType / 100) * counts.rx);
  } else if (scaledType === 1) {
    // Scaled: rank = all RX + position within Scaled
    rankWithinTotal = counts.rx + Math.round((percentileWithinType / 100) * counts.scaled);
  } else {
    // Foundations: rank = all RX + all Scaled + position within Foundations
    rankWithinTotal = counts.rx + counts.scaled + Math.round((percentileWithinType / 100) * counts.foundations);
  }

  const overallPercentile = counts.total > 0
    ? Math.round((rankWithinTotal / counts.total) * 100)
    : 100;

  return {
    overallPercentile: Math.max(1, Math.min(100, overallPercentile)),
    estimatedRank: rankWithinTotal,
  };
}

export default function SimulatorPage() {
  const [year, setYear] = useState(2024);
  const [division, setDivision] = useState<DivisionId>(DIVISIONS.MEN);
  const [scores, setScores] = useState<Record<number, UserScore>>({});
  const [activeWorkout, setActiveWorkout] = useState<number | null>(null);
  const [percentileData, setPercentileData] = useState<PercentileDataMap>({});
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
          setPercentileData(data.percentiles || {});

          // Get total athletes from first workout's counts
          const firstWorkout = Object.values(data.percentiles || {})[0] as WorkoutPercentileData | undefined;
          if (firstWorkout?.counts?.total) {
            setTotalAthletes(firstWorkout.counts.total);
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

  // Recalculate percentiles when data is loaded or updated
  useEffect(() => {
    if (Object.keys(percentileData).length === 0) return;

    setScores((prev) => {
      const updated = { ...prev };
      for (const [ordinalStr, score] of Object.entries(prev)) {
        const ordinal = parseInt(ordinalStr, 10);
        if (!score.parsed?.isValid) continue;

        const workoutData = percentileData[ordinal];
        if (!workoutData) continue;

        const rxBuckets = workoutData.byScaled[USER_SCALED_TYPE] || [];
        if (rxBuckets.length === 0) continue;

        const workout = workouts.find((w) => w.ordinal === ordinal);
        const isAsc = workout?.sortDirection === "asc";

        let percentileWithinRx: number | null = null;

        // Find percentile within RX
        for (const bucket of rxBuckets) {
          const inRange = isAsc
            ? score.parsed.scorePrimaryRaw <= bucket.upperBound
            : score.parsed.scorePrimaryRaw >= bucket.lowerBound;

          if (inRange) {
            percentileWithinRx = bucket.percentile;
            break;
          }
        }

        // Handle scores outside our data range
        if (percentileWithinRx === null) {
          percentileWithinRx = 100; // Bottom of RX
        }

        // Calculate overall percentile using hierarchy
        const { overallPercentile, estimatedRank } = calculateOverallPercentile(
          percentileWithinRx,
          workoutData.counts,
          USER_SCALED_TYPE
        );

        updated[ordinal] = {
          ...score,
          percentile: overallPercentile,
          estimatedRank,
        };
      }
      return updated;
    });
  }, [percentileData, workouts]);

  const handleScoreChange = useCallback(
    (ordinal: number, value: string, parsed: ParsedScore | null) => {
      setScores((prev) => {
        let percentile: number | null = null;
        let estimatedRank: number | null = null;

        const workoutData = percentileData[ordinal];
        const rxBuckets = workoutData?.byScaled?.[USER_SCALED_TYPE] || [];

        if (parsed?.isValid && rxBuckets.length > 0 && workoutData?.counts) {
          const workout = workouts.find((w) => w.ordinal === ordinal);
          const isAsc = workout?.sortDirection === "asc";

          let percentileWithinRx: number | null = null;

          // Find percentile within RX
          for (const bucket of rxBuckets) {
            let inRange: boolean;

            if (isAsc) {
              // For time (lower is better): score should be <= upperBound
              inRange = parsed.scorePrimaryRaw <= bucket.upperBound;
            } else {
              // For reps/load (higher is better): score should be >= lowerBound
              inRange = parsed.scorePrimaryRaw >= bucket.lowerBound;
            }

            if (inRange) {
              percentileWithinRx = bucket.percentile;
              break;
            }
          }

          // Handle scores outside our data range
          if (percentileWithinRx === null) {
            percentileWithinRx = 100; // Bottom of RX
          }

          // Calculate overall percentile using hierarchy
          const result = calculateOverallPercentile(
            percentileWithinRx,
            workoutData.counts,
            USER_SCALED_TYPE
          );
          percentile = result.overallPercentile;
          estimatedRank = result.estimatedRank;
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
    [percentileData, workouts]
  );

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
          </div>
        </div>
      </main>
    </div>
  );
}
