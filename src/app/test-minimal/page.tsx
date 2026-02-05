"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { WorkoutCard } from "@/components/simulator/WorkoutCard";
import type { WorkoutMetadata, ParsedScore, UserScore } from "@/types";

// Progressively add components to find what breaks touch

// Sample workout data matching the actual type
const sampleWorkout: WorkoutMetadata = {
  ordinal: 1,
  name: "24.1",
  description: "21-15-9 dumbbell snatches and burpees over dumbbell",
  detailedDescription: "For time:\n21 dumbbell snatches\n21 burpees over dumbbell\n15 dumbbell snatches\n15 burpees over dumbbell\n9 dumbbell snatches\n9 burpees over dumbbell",
  scoreType: "time",
  sortDirection: "asc",
  timeCapSeconds: 900,
};

// Multiple workouts like simulator
const workouts: WorkoutMetadata[] = [
  sampleWorkout,
  {
    ordinal: 2,
    name: "24.2",
    description: "For time: rowing, double-unders, and thrusters",
    scoreType: "time",
    sortDirection: "asc",
    timeCapSeconds: 1200,
    cappedScoreType: "reps",
    totalReps: 150,
  },
  {
    ordinal: 3,
    name: "24.3",
    description: "AMRAP in 15 minutes",
    scoreType: "rounds_reps",
    sortDirection: "desc",
    repsPerRound: 30,
  },
];

export default function TestMinimalPage() {
  const [count, setCount] = useState(0);
  const [year, setYear] = useState(2024);
  const [scores, setScores] = useState<Record<number, UserScore>>({});
  const [activeWorkout, setActiveWorkout] = useState<number | null>(1);
  const [percentileBuckets, setPercentileBuckets] = useState<Record<number, Array<{
    percentile: number;
    lowerBound: number;
    upperBound: number;
    athleteCount: number | null;
  }>>>({});

  // Mimic the simulator's useEffect that fetches data
  useEffect(() => {
    // Simulate API fetch delay
    const timer = setTimeout(() => {
      setPercentileBuckets({
        1: Array.from({ length: 100 }, (_, i) => ({
          percentile: i + 1,
          lowerBound: i * 10,
          upperBound: (i + 1) * 10,
          athleteCount: 50000,
        })),
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [year]);

  const handleScoreChange = (ordinal: number, value: string, parsed: ParsedScore | null) => {
    setScores((prev) => ({
      ...prev,
      [ordinal]: {
        input: value,
        parsed,
        percentile: null,
        estimatedRank: null,
      },
    }));
  };

  const activeWorkoutData = workouts.find((w) => w.ordinal === activeWorkout);
  const activeScore = activeWorkout ? scores[activeWorkout] : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Actual Header component from simulator */}
      <Header />

      {/* Year/Division Selectors - same as simulator */}
      <div className="container mx-auto px-4 py-4 flex gap-4">
        <Select value={String(year)} onValueChange={(val) => setYear(parseInt(val, 10))}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2024">2024 Open</SelectItem>
            <SelectItem value="2023">2023 Open</SelectItem>
            <SelectItem value="2022">2022 Open</SelectItem>
          </SelectContent>
        </Select>

        <Select value="1" onValueChange={() => {}}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Division" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Men (RX)</SelectItem>
            <SelectItem value="2">Women (RX)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content - same grid layout as simulator */}
      <main className="container mx-auto px-4 pb-8">
        <p className="text-sm text-muted-foreground mb-4">
          Tap count: {count} | Year: {year}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - WorkoutCards rendered in a loop like simulator */}
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
                  totalAthletes={50000}
                  isActive={activeWorkout === workout.ordinal}
                  onFocus={() => setActiveWorkout(workout.ordinal)}
                />
              );
            })}
          </div>

          {/* Right Column - Simple placeholders (no ResultsPanel/DistributionChart) */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Results Placeholder</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Active workout: {activeWorkout}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Chart Placeholder</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Scores entered: {Object.keys(scores).length}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
