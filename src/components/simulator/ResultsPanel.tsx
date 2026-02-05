"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WorkoutMetadata, UserScore } from "@/types";
import { cn } from "@/lib/utils";

interface ResultsPanelProps {
  year: number;
  workouts: WorkoutMetadata[];
  scores: Record<number, UserScore>;
  totalAthletes: number | null;
  overallRank?: number | null;
  overallPercentile?: number | null;
  loadingOverall?: boolean;
  className?: string;
}

export function ResultsPanel({
  year,
  workouts,
  scores,
  totalAthletes,
  overallRank: propOverallRank,
  overallPercentile: propOverallPercentile,
  loadingOverall = false,
  className,
}: ResultsPanelProps) {
  // Calculate overall stats
  const workoutsEntered = Object.values(scores).filter(
    (s) => s.parsed?.isValid
  ).length;
  const totalWorkouts = workouts.length;
  const allEntered = workoutsEntered === totalWorkouts && totalWorkouts > 0;

  // Calculate total points (sum of ranks) and average percentile
  let totalPoints = 0;
  let percentileSum = 0;
  let canCalculateOverall = allEntered;

  for (const workout of workouts) {
    const score = scores[workout.ordinal];
    if (score?.estimatedRank && score?.percentile !== null && score?.percentile !== undefined) {
      totalPoints += score.estimatedRank;
      percentileSum += score.percentile;
    } else {
      canCalculateOverall = false;
    }
  }

  // Use prop values from overall leaderboard lookup if available,
  // otherwise fall back to estimated values from per-workout ranks
  const estimatedOverallRank = propOverallRank ?? (canCalculateOverall
    ? Math.round(totalPoints / totalWorkouts)
    : null);

  // Use prop percentile from overall lookup if available
  const overallPercentile = propOverallPercentile ?? (
    estimatedOverallRank && totalAthletes
      ? Math.round(((totalAthletes - estimatedOverallRank + 1) / totalAthletes) * 1000) / 10
      : null
  );

  const getPercentileLabel = (p: number) => {
    return `${p}%`;
  };

  // Higher percentile = better (green/blue colors)
  const getPercentileColor = (p: number) => {
    if (p >= 99) return "text-blue-700";
    if (p >= 95) return "text-blue-600";
    if (p >= 90) return "text-blue-500";
    if (p >= 75) return "text-green-500";
    if (p >= 50) return "text-yellow-600";
    if (p >= 25) return "text-orange-500";
    return "text-red-500";
  };

  const formatRank = (rank: number) => {
    const formatted = rank.toLocaleString();
    const suffix = getOrdinalSuffix(rank);
    return `${formatted}${suffix}`;
  };

  const getOrdinalSuffix = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Results Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Your Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Percentile */}
          <div
            className={cn(
              "rounded-lg p-4",
              overallPercentile
                ? "bg-green-50 dark:bg-green-950"
                : "bg-muted"
            )}
          >
            <p className="text-sm text-muted-foreground">
              Overall Percentile:
            </p>
            <p
              className={cn(
                "text-2xl font-bold",
                loadingOverall
                  ? "text-muted-foreground animate-pulse"
                  : overallPercentile
                    ? getPercentileColor(overallPercentile)
                    : "text-muted-foreground"
              )}
            >
              {loadingOverall
                ? "Calculating..."
                : overallPercentile
                  ? getPercentileLabel(overallPercentile)
                  : "Enter all scores"}
            </p>
          </div>

          {/* Estimated Rank */}
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">
              {propOverallRank ? "Overall Rank:" : "Estimated Rank:"}
            </span>
            <span className={cn("font-semibold", loadingOverall && "animate-pulse")}>
              {loadingOverall
                ? "..."
                : estimatedOverallRank && totalAthletes
                  ? `${formatRank(estimatedOverallRank)} / ${totalAthletes.toLocaleString()}`
                  : "-"}
            </span>
          </div>

          {/* Total Points */}
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Total Points:</span>
            <span className="font-semibold">
              {canCalculateOverall ? totalPoints.toLocaleString() : "-"}
            </span>
          </div>

          {/* Workouts Entered */}
          <div className="flex items-center gap-2 py-2">
            {allEntered && <span className="text-lg">🎉</span>}
            <span
              className={cn(
                allEntered ? "text-green-600 font-medium" : "text-muted-foreground"
              )}
            >
              {workoutsEntered} of {totalWorkouts} Workouts Entered
            </span>
            {allEntered && <span className="text-lg">🎉</span>}
          </div>
        </CardContent>
      </Card>

      {/* Per-Workout Results */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Final Simulation Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {workouts.map((workout) => {
            const score = scores[workout.ordinal];
            const percentile = score?.percentile;
            const rank = score?.estimatedRank;

            return (
              <div
                key={workout.ordinal}
                className="flex justify-between items-center"
              >
                <span className="font-medium">{workout.name}</span>
                {percentile !== null && percentile !== undefined ? (
                  <div className="flex items-center gap-2">
                    {rank && (
                      <span className="text-sm text-muted-foreground">
                        {formatRank(rank)}
                      </span>
                    )}
                    <Badge
                      variant="secondary"
                      className={cn(
                        "font-semibold",
                        getPercentileColor(percentile)
                      )}
                    >
                      {getPercentileLabel(percentile)}
                    </Badge>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">
                    Not Entered
                  </span>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Share Button */}
      <Button className="w-full" variant="default" disabled={!allEntered}>
        <span className="mr-2">📤</span>
        Share Results
      </Button>
    </div>
  );
}
