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
  className?: string;
}

export function ResultsPanel({
  year,
  workouts,
  scores,
  totalAthletes,
  className,
}: ResultsPanelProps) {
  // Calculate overall stats
  const workoutsEntered = Object.values(scores).filter(
    (s) => s.parsed?.isValid
  ).length;
  const totalWorkouts = workouts.length;
  const allEntered = workoutsEntered === totalWorkouts && totalWorkouts > 0;

  // Calculate estimated overall rank (sum of individual ranks)
  let totalPoints = 0;
  let canCalculateOverall = allEntered;

  for (const workout of workouts) {
    const score = scores[workout.ordinal];
    if (score?.estimatedRank) {
      totalPoints += score.estimatedRank;
    } else {
      canCalculateOverall = false;
    }
  }

  // Estimate overall rank based on total points
  // This is a rough estimate - actual ranking depends on points distribution
  const estimatedOverallRank = canCalculateOverall
    ? Math.round(totalPoints / totalWorkouts)
    : null;

  const overallPercentile =
    estimatedOverallRank && totalAthletes
      ? Math.round((estimatedOverallRank / totalAthletes) * 100)
      : null;

  const getPercentileLabel = (p: number) => {
    if (p >= 100) return "N/A";
    return `${p}%`;
  };

  const getPercentileColor = (p: number) => {
    if (p <= 1) return "text-blue-700";
    if (p <= 5) return "text-blue-600";
    if (p <= 10) return "text-blue-500";
    if (p <= 25) return "text-green-500";
    if (p <= 50) return "text-yellow-600";
    return "text-orange-500";
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
                overallPercentile
                  ? getPercentileColor(overallPercentile)
                  : "text-muted-foreground"
              )}
            >
              {overallPercentile
                ? getPercentileLabel(overallPercentile)
                : "Enter all scores"}
            </p>
          </div>

          {/* Estimated Rank */}
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Estimated Rank:</span>
            <span className="font-semibold">
              {estimatedOverallRank && totalAthletes
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

            return (
              <div
                key={workout.ordinal}
                className="flex justify-between items-center"
              >
                <span className="font-medium">{workout.name}</span>
                {percentile !== null && percentile !== undefined ? (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "font-semibold",
                      getPercentileColor(percentile)
                    )}
                  >
                    {getPercentileLabel(percentile)}
                  </Badge>
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
