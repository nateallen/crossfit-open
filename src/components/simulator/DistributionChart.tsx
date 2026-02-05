"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WorkoutMetadata } from "@/types";

interface DistributionChartProps {
  workout: WorkoutMetadata | null;
  userScore: number | null;
  percentileBuckets: Array<{
    percentile: number;
    lowerBound: number;
    upperBound: number;
    athleteCount: number | null;
  }> | null;
}

export function DistributionChart({
  workout,
  userScore,
  percentileBuckets,
}: DistributionChartProps) {
  if (!workout) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Score Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-48 flex items-center justify-center text-muted-foreground">
          Select a workout to view distribution
        </CardContent>
      </Card>
    );
  }

  // Generate distribution data from percentile buckets or placeholder
  const generateChartData = () => {
    if (!percentileBuckets || percentileBuckets.length === 0) {
      // Generate placeholder data
      return Array.from({ length: 20 }, (_, i) => ({
        bucket: i,
        count: Math.floor(
          Math.random() * 5000 + 1000 * Math.sin((i / 20) * Math.PI)
        ),
        label: `${i * 5}-${(i + 1) * 5}%`,
      }));
    }

    // Aggregate percentile buckets into 20 bars (5% each)
    const aggregated: Array<{
      bucket: number;
      count: number;
      label: string;
      minScore: number;
      maxScore: number;
    }> = [];

    for (let i = 0; i < 20; i++) {
      const startPercentile = i * 5 + 1;
      const endPercentile = (i + 1) * 5;

      const bucketsInRange = percentileBuckets.filter(
        (b) => b.percentile >= startPercentile && b.percentile <= endPercentile
      );

      const minScore = Math.min(...bucketsInRange.map((b) => b.lowerBound));
      const maxScore = Math.max(...bucketsInRange.map((b) => b.upperBound));
      const totalAthletes = bucketsInRange[0]?.athleteCount || 0;

      // Estimate count in this bucket (5% of total)
      const count = Math.round(totalAthletes * 0.05);

      aggregated.push({
        bucket: i,
        count,
        label: `Top ${endPercentile}%`,
        minScore,
        maxScore,
      });
    }

    return aggregated;
  };

  const data = generateChartData();

  // Find which bucket the user's score falls into
  const getUserBucketIndex = () => {
    if (userScore === null || !percentileBuckets) return null;

    for (let i = 0; i < 20; i++) {
      const startPercentile = i * 5 + 1;
      const endPercentile = (i + 1) * 5;

      const bucketsInRange = percentileBuckets.filter(
        (b) => b.percentile >= startPercentile && b.percentile <= endPercentile
      );

      for (const bucket of bucketsInRange) {
        if (workout.sortDirection === "asc") {
          // Lower is better (time)
          if (userScore >= bucket.lowerBound && userScore <= bucket.upperBound) {
            return i;
          }
        } else {
          // Higher is better (reps, load)
          if (userScore >= bucket.lowerBound && userScore <= bucket.upperBound) {
            return i;
          }
        }
      }
    }

    return null;
  };

  const userBucketIndex = getUserBucketIndex();

  const getBarColor = (index: number) => {
    // Color based on percentile (darker = better)
    if (index < 1) return "#1d4ed8"; // Top 5% - dark blue
    if (index < 2) return "#2563eb"; // Top 10%
    if (index < 4) return "#3b82f6"; // Top 20%
    if (index < 5) return "#06b6d4"; // Top 25% - cyan
    if (index < 10) return "#22c55e"; // Top 50% - green
    if (index < 15) return "#eab308"; // Top 75% - yellow
    return "#f97316"; // Bottom 25% - orange
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          {workout.name} Score Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10 }}
                interval={3}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                formatter={(value) => [
                  `~${Number(value).toLocaleString()} athletes`,
                  "Count",
                ]}
                labelFormatter={(label) => String(label)}
              />
              <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      index === userBucketIndex
                        ? "#f97316" // Highlight user's bucket in orange
                        : getBarColor(index)
                    }
                    stroke={index === userBucketIndex ? "#000" : "none"}
                    strokeWidth={index === userBucketIndex ? 2 : 0}
                  />
                ))}
              </Bar>
              {userBucketIndex !== null && (
                <ReferenceLine
                  x={data[userBucketIndex]?.label}
                  stroke="#f97316"
                  strokeWidth={2}
                  label={{
                    value: "Your Score",
                    position: "top",
                    fill: "#f97316",
                    fontSize: 12,
                  }}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>Top 10%</span>
          <span>Median</span>
          <span>Top 10%</span>
          <span>Top 1%</span>
        </div>
      </CardContent>
    </Card>
  );
}
