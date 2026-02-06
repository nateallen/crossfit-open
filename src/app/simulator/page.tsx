"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
import { Footer } from "@/components/Footer";
import type { ParsedScore, UserScore, DivisionId } from "@/types";
import { DIVISIONS } from "@/types";
import { getWorkoutsForYear, getAvailableYears } from "@/lib/workout-metadata";

// Currently we only support RX score entry (scaled=0)
const USER_SCALED_TYPE = 0;

function getInitialYear(yearParam: string | null, availableYears: number[]): number {
  if (yearParam) {
    const parsed = parseInt(yearParam, 10);
    if (!isNaN(parsed) && availableYears.includes(parsed)) {
      return parsed;
    }
  }
  return availableYears[0] || 2025;
}

// Wrapper component to handle Suspense for useSearchParams
export default function SimulatorPage() {
  return (
    <Suspense fallback={<SimulatorLoading />}>
      <SimulatorContent />
    </Suspense>
  );
}

function SimulatorLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div
        className="h-32 -mb-32 pointer-events-none header-gradient"
      />
      <div className="container mx-auto px-4 py-12 text-center text-muted-foreground flex-1">
        Loading simulator...
      </div>
      <Footer />
    </div>
  );
}

function SimulatorContent() {
  const searchParams = useSearchParams();
  const availableYears = getAvailableYears();
  const [year, setYear] = useState(() => getInitialYear(searchParams.get("year"), availableYears));
  const [division, setDivision] = useState<DivisionId>(DIVISIONS.MEN);
  const [scores, setScores] = useState<Record<number, UserScore>>({});
  const [activeWorkout, setActiveWorkout] = useState<number | null>(null);
  const [loadingWorkouts, setLoadingWorkouts] = useState<Set<number>>(new Set());
  const [totalAthletes, setTotalAthletes] = useState<Record<number, number>>({});

  // Overall rank state
  const [overallRank, setOverallRank] = useState<number | null>(null);
  const [overallPercentile, setOverallPercentile] = useState<number | null>(null);
  const [loadingOverall, setLoadingOverall] = useState(false);

  // Track pending lookups to cancel stale requests
  const pendingLookups = useRef<Record<number, AbortController>>({});
  const pendingOverallLookup = useRef<AbortController | null>(null);
  // Track what scores we've already looked up to avoid duplicate lookups
  const lastLookedUp = useRef<Record<number, string>>({});
  const lastOverallPoints = useRef<number | null>(null);

  const workouts = getWorkoutsForYear(year);

  // Clear all scores and cancel pending lookups
  const clearState = useCallback(() => {
    Object.values(pendingLookups.current).forEach((controller) => controller.abort());
    pendingLookups.current = {};
    if (pendingOverallLookup.current) {
      pendingOverallLookup.current.abort();
      pendingOverallLookup.current = null;
    }
    setScores({});
    setTotalAthletes({});
    setOverallRank(null);
    setOverallPercentile(null);
    setLoadingWorkouts(new Set());
    setLoadingOverall(false);
    lastLookedUp.current = {};
    lastOverallPoints.current = null;
  }, []);

  // Look up overall rank when all workouts are entered
  useEffect(() => {
    // Calculate total points from all workouts
    const allWorkoutsEntered = workouts.every((w) => {
      const score = scores[w.ordinal];
      return score?.estimatedRank && score?.parsed?.isValid;
    });

    if (!allWorkoutsEntered || workouts.length === 0) {
      setOverallRank(null);
      setOverallPercentile(null);
      return;
    }

    // Calculate total points (sum of ranks)
    const totalPoints = workouts.reduce((sum, w) => {
      const rank = scores[w.ordinal]?.estimatedRank || 0;
      return sum + rank;
    }, 0);

    // Skip if we already looked up this exact total
    if (lastOverallPoints.current === totalPoints) {
      return;
    }
    lastOverallPoints.current = totalPoints;

    // Cancel pending overall lookup
    if (pendingOverallLookup.current) {
      pendingOverallLookup.current.abort();
    }

    const controller = new AbortController();
    pendingOverallLookup.current = controller;

    setLoadingOverall(true);

    fetch("/api/overall-lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        year,
        division,
        scaled: USER_SCALED_TYPE,
        totalPoints,
      }),
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Overall lookup failed");
        return response.json();
      })
      .then((result) => {
        if (result.success) {
          setOverallRank(result.overallRank);
          setOverallPercentile(result.overallPercentile);
        }
      })
      .catch((error) => {
        if ((error as Error).name === "AbortError") return;
        console.error("Overall lookup error:", error);
        lastOverallPoints.current = null; // Allow retry
      })
      .finally(() => {
        setLoadingOverall(false);
        pendingOverallLookup.current = null;
      });
  }, [scores, workouts, year, division]);

  // Look up percentile using the anchor-based API
  const lookupPercentile = useCallback(
    async (ordinal: number, score: string, tiebreak?: string) => {
      // Create a lookup key that includes tiebreak
      const lookupKey = `${score}|${tiebreak || ""}`;

      // Skip if we already looked up this exact score+tiebreak
      if (lastLookedUp.current[ordinal] === lookupKey) {
        return;
      }
      lastLookedUp.current[ordinal] = lookupKey;

      // Cancel any pending lookup for this workout
      if (pendingLookups.current[ordinal]) {
        pendingLookups.current[ordinal].abort();
      }

      const controller = new AbortController();
      pendingLookups.current[ordinal] = controller;

      setLoadingWorkouts((prev) => new Set(prev).add(ordinal));

      try {
        const response = await fetch("/api/percentile-lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            year,
            division,
            scaled: USER_SCALED_TYPE,
            workoutOrdinal: ordinal,
            score,
            tiebreak: tiebreak || undefined,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Lookup failed");
        }

        const result = await response.json();

        // Update score with percentile result
        setScores((prev) => ({
          ...prev,
          [ordinal]: {
            ...prev[ordinal],
            percentile: result.success ? result.percentile : null,
            estimatedRank: result.success ? result.estimatedRank : null,
          },
        }));

        // Update total athletes for this workout
        if (result.totalCompetitors) {
          setTotalAthletes((prev) => ({
            ...prev,
            [ordinal]: result.totalCompetitors,
          }));
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return; // Request was cancelled, ignore
        }
        console.error("Percentile lookup error:", error);
        // Clear the lookup cache on error so user can retry
        delete lastLookedUp.current[ordinal];
      } finally {
        setLoadingWorkouts((prev) => {
          const next = new Set(prev);
          next.delete(ordinal);
          return next;
        });
        delete pendingLookups.current[ordinal];
      }
    },
    [year, division]
  );

  const handleScoreChange = useCallback(
    (ordinal: number, value: string, parsed: ParsedScore | null, tiebreak?: string) => {
      // Update the input immediately
      setScores((prev) => {
        // Don't update if nothing changed
        if (prev[ordinal]?.input === value && prev[ordinal]?.tiebreak === tiebreak) {
          return prev;
        }
        return {
          ...prev,
          [ordinal]: {
            input: value,
            parsed,
            percentile: prev[ordinal]?.percentile ?? null,
            estimatedRank: prev[ordinal]?.estimatedRank ?? null,
            tiebreak,
          },
        };
      });

      // If we have a valid parsed score, look up the percentile
      if (parsed?.isValid && value.trim()) {
        lookupPercentile(ordinal, value, tiebreak);
      } else if (!value.trim()) {
        // Clear percentile if score is empty
        delete lastLookedUp.current[ordinal];
        setScores((prev) => ({
          ...prev,
          [ordinal]: {
            input: value,
            parsed,
            percentile: null,
            estimatedRank: null,
            tiebreak: undefined,
          },
        }));
      }
    },
    [lookupPercentile]
  );

  // Get the total athletes for a specific workout
  const getDisplayTotalAthletes = (ordinal: number) => {
    return totalAthletes[ordinal] || null;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      {/* Gradient fade from header */}
      <div
        className="h-32 -mb-32 pointer-events-none header-gradient"
      />

      {/* Year/Division Selectors */}
      <div className="container mx-auto px-4 py-4 flex gap-4">
        <Select
          value={String(year)}
          onValueChange={(val) => {
            clearState();
            const newYear = parseInt(val, 10);
            setYear(newYear);
            const newWorkouts = getWorkoutsForYear(newYear);
            setActiveWorkout(newWorkouts[0]?.ordinal || null);
          }}
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
          onValueChange={(val) => {
            clearState();
            setDivision(parseInt(val, 10) as DivisionId);
            setActiveWorkout(workouts[0]?.ordinal || null);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select division" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={String(DIVISIONS.MEN)}>Men (RX)</SelectItem>
            <SelectItem value={String(DIVISIONS.WOMEN)}>Women (RX)</SelectItem>
            <SelectItem value={String(DIVISIONS.MEN_35_39)}>Men 35-39</SelectItem>
            <SelectItem value={String(DIVISIONS.WOMEN_35_39)}>Women 35-39</SelectItem>
            <SelectItem value={String(DIVISIONS.MEN_40_44)}>Men 40-44</SelectItem>
            <SelectItem value={String(DIVISIONS.WOMEN_40_44)}>Women 40-44</SelectItem>
            <SelectItem value={String(DIVISIONS.MEN_45_49)}>Men 45-49</SelectItem>
            <SelectItem value={String(DIVISIONS.WOMEN_45_49)}>Women 45-49</SelectItem>
            <SelectItem value={String(DIVISIONS.MEN_50_54)}>Men 50-54</SelectItem>
            <SelectItem value={String(DIVISIONS.WOMEN_50_54)}>Women 50-54</SelectItem>
            <SelectItem value={String(DIVISIONS.MEN_55_59)}>Men 55-59</SelectItem>
            <SelectItem value={String(DIVISIONS.WOMEN_55_59)}>Women 55-59</SelectItem>
            <SelectItem value={String(DIVISIONS.MEN_60_PLUS)}>Men 60+</SelectItem>
            <SelectItem value={String(DIVISIONS.WOMEN_60_PLUS)}>Women 60+</SelectItem>
            <SelectItem value={String(DIVISIONS.MEN_65_PLUS)}>Men 65+</SelectItem>
            <SelectItem value={String(DIVISIONS.WOMEN_65_PLUS)}>Women 65+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-8 flex-1">
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
                  key={`${year}-${division}-${workout.ordinal}`}
                  workout={workout}
                  value={score.input}
                  tiebreak={score.tiebreak}
                  onChange={(value, parsed, tiebreak) =>
                    handleScoreChange(workout.ordinal, value, parsed, tiebreak)
                  }
                  percentile={score.percentile}
                  estimatedRank={score.estimatedRank}
                  totalAthletes={getDisplayTotalAthletes(workout.ordinal)}
                  isActive={activeWorkout === workout.ordinal}
                  onFocus={() => setActiveWorkout(workout.ordinal)}
                  isLoading={loadingWorkouts.has(workout.ordinal)}
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
              totalAthletes={Object.values(totalAthletes)[0] || null}
              overallRank={overallRank}
              overallPercentile={overallPercentile}
              loadingOverall={loadingOverall}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
