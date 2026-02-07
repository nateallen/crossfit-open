"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PercentileBar } from "./PercentileBar";
import { parseScore, formatTime } from "@/lib/score-parser";
import type { WorkoutMetadata, ParsedScore } from "@/types";
import { cn } from "@/lib/utils";

interface WorkoutCardProps {
  workout: WorkoutMetadata;
  value: string;
  tiebreak?: string;
  scaled?: number; // 0=RX, 1=Scaled, 2=Foundations
  onChange: (value: string, parsed: ParsedScore | null, tiebreak?: string) => void;
  onScaledChange?: (scaled: number) => void;
  percentile: number | null;
  estimatedRank: number | null;
  totalAthletes: number | null;
  isActive: boolean;
  onFocus: () => void;
  isLoading?: boolean;
}

/** Check if workout is a hybrid (time for finishers, reps for capped) */
function isHybridWorkout(workout: WorkoutMetadata): boolean {
  return workout.scoreType === "time" && workout.cappedScoreType === "reps";
}

export function WorkoutCard({
  workout,
  value,
  tiebreak = "",
  scaled = 0,
  onChange,
  onScaledChange,
  percentile,
  estimatedRank,
  totalAthletes,
  isActive,
  onFocus,
  isLoading = false,
}: WorkoutCardProps) {
  const [localValue, setLocalValue] = useState(value);
  const [parsed, setParsed] = useState<ParsedScore | null>(null);
  const [didFinish, setDidFinish] = useState<boolean | null>(null);
  const [tiebreakValue, setTiebreakValue] = useState(tiebreak);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const isHybrid = isHybridWorkout(workout);

  // For hybrid workouts, keep the original scoreType
  // The parseTimeScore function handles both time and reps input
  const effectiveWorkout: WorkoutMetadata = workout;

  // Track if we've already called onChange for this value/tiebreak to prevent loops
  const lastReportedValue = useRef(value);
  const lastReportedTiebreak = useRef(tiebreak);

  // Stable ref for onChange to prevent debounce resets on parent re-renders
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Track debounce timer for flushing on blur
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Core lookup trigger logic (shared by debounce and blur flush)
  const triggerOnChange = useCallback(() => {
    const valueChanged = localValue !== lastReportedValue.current;
    const tiebreakChanged = tiebreakValue !== lastReportedTiebreak.current;

    if (!valueChanged && !tiebreakChanged) {
      return;
    }

    lastReportedValue.current = localValue;
    lastReportedTiebreak.current = tiebreakValue;

    if (localValue.trim()) {
      const result = parseScore(localValue, effectiveWorkout);
      // Add isFinisher flag for hybrid workouts
      if (isHybrid && result.isValid) {
        result.isFinisher = didFinish === true;
      }
      setParsed(result);
      // Pass tiebreak only if it's a valid format (M:SS)
      const validTiebreak = tiebreakValue.match(/^\d+:\d{2}$/) ? tiebreakValue : undefined;
      onChangeRef.current(localValue, result.isValid ? result : null, validTiebreak);
    } else {
      setParsed(null);
      onChangeRef.current(localValue, null, undefined);
    }
  }, [localValue, tiebreakValue, effectiveWorkout, isHybrid, didFinish]);

  // Parse on value change with debounce
  useEffect(() => {
    debounceTimer.current = setTimeout(() => {
      debounceTimer.current = null;
      triggerOnChange();
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [triggerOnChange]);

  // Flush pending lookup immediately on blur
  const handleBlur = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
      triggerOnChange();
    }
  }, [triggerOnChange]);

  // Reset finish status and tiebreak when workout changes
  useEffect(() => {
    setDidFinish(null);
    setTiebreakValue("");
  }, [workout.ordinal]);

  const getPlaceholder = () => {
    if (isHybrid && didFinish === null) {
      return "Select if you finished...";
    }
    if (isHybrid && didFinish === false) {
      return "e.g., 136 reps";
    }
    switch (effectiveWorkout.scoreType) {
      case "time":
        return "e.g., 9:02 or 9m02s";
      case "reps":
        return "e.g., 158 or 158 reps";
      case "rounds_reps":
        return "e.g., 7+12";
      case "load":
        return "e.g., 225 or 225 lb";
      default:
        return "Enter score...";
    }
  };

  const getScoreTypeLabel = () => {
    if (isHybrid) {
      const cap = workout.timeCapSeconds
        ? formatTime(workout.timeCapSeconds)
        : "";
      return `TIME / REPS${cap ? ` CAP ${cap}` : ""}`;
    }
    switch (workout.scoreType) {
      case "time":
        return workout.timeCapSeconds
          ? `TIME CAP ${formatTime(workout.timeCapSeconds)}`
          : "TIME";
      case "reps":
        return workout.timeCapSeconds
          ? `REPS (${formatTime(workout.timeCapSeconds)})`
          : "REPS";
      case "rounds_reps":
        return "ROUNDS + REPS";
      case "load":
        return "LOAD";
      default:
        return "";
    }
  };

  const formatRank = (rank: number, total: number) => {
    const formatted = rank.toLocaleString();
    const suffix = getOrdinalSuffix(rank);
    return `${formatted}${suffix} / ${total.toLocaleString()}`;
  };

  const getOrdinalSuffix = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  return (
    <Card
      className={cn(
        "transition-all duration-200",
        isActive && "ring-2 ring-primary"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            {workout.name}
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {getScoreTypeLabel()}
          </Badge>
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-3">
          {workout.scorecardPdf && (
            <a
              href={workout.scorecardPdf}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              Scorecard
            </a>
          )}
          {workout.announcementVideo && (
            <a
              href={workout.announcementVideo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Video
            </a>
          )}
          </div>
          {(workout.detailedDescription || workout.description) && (
            <button
              onClick={() => setIsDetailsOpen(!isDetailsOpen)}
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors"
            >
              <span className="underline underline-offset-2">
                {isDetailsOpen ? "Hide Description" : "Description"}
              </span>
              <ChevronDown
                className={cn(
                  "h-3 w-3 transition-transform duration-200",
                  isDetailsOpen && "rotate-180"
                )}
              />
            </button>
          )}
        </div>
        {isDetailsOpen && (workout.detailedDescription || workout.description) && (
          <div className="mt-2 p-3 bg-muted/50 rounded-md border">
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">
              {workout.detailedDescription || workout.description}
            </pre>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* RX / Scaled / Foundations Toggle */}
        <div className="flex rounded-md border overflow-hidden">
          {[
            { value: 0, label: "RX" },
            { value: 1, label: "Scaled" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => onScaledChange?.(option.value)}
              className={cn(
                "flex-1 px-3 py-1.5 text-xs font-medium transition-colors",
                scaled === option.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Hybrid Workout Toggle */}
        {isHybrid && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={didFinish === true ? "default" : "outline"}
              onClick={() => {
                setDidFinish(true);
                setLocalValue("");
              }}
              className="flex-1"
            >
              Finished
            </Button>
            <Button
              size="sm"
              variant={didFinish === false ? "default" : "outline"}
              onClick={() => {
                setDidFinish(false);
                setLocalValue("");
              }}
              className="flex-1"
            >
              Hit Cap ({workout.totalReps} reps max)
            </Button>
          </div>
        )}

        {/* Input Row - only show if hybrid status selected or not hybrid */}
        {(!isHybrid || didFinish !== null) && (
          <div className="flex items-center gap-3">
            <Input
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              onFocus={onFocus}
              onBlur={handleBlur}
              placeholder={getPlaceholder()}
              className={cn(
                "flex-1",
                parsed && !parsed.isValid && "border-destructive"
              )}
            />
            {parsed && parsed.isValid && (
              <Badge variant="outline" className="whitespace-nowrap">
                {didFinish === true && "Time: "}
                {didFinish === false && "Reps: "}
                {parsed.scorePrimaryDisplay}
              </Badge>
            )}
          </div>
        )}

        {/* Tiebreak Input (for capped athletes on hybrid workouts) */}
        {isHybrid && didFinish === false && workout.tiebreak && (
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Tiebreak time ({workout.tiebreak.description})
            </label>
            <Input
              value={tiebreakValue}
              onChange={(e) => setTiebreakValue(e.target.value)}
              onBlur={handleBlur}
              placeholder="e.g., 6:45"
              className="text-sm"
            />
          </div>
        )}

        {/* Error Message */}
        {parsed && !parsed.isValid && (
          <p className="text-sm text-destructive">{parsed.error}</p>
        )}

        {/* Rank Estimate */}
        {!isLoading && estimatedRank !== null && totalAthletes !== null ? (
          <p className="text-sm text-muted-foreground">
            ≈ {formatRank(estimatedRank, totalAthletes)}
          </p>
        ) : null}

        {/* Percentile Bar */}
        <PercentileBar percentile={percentile} isLoading={isLoading} />
      </CardContent>
    </Card>
  );
}
