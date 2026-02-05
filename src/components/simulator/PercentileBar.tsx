"use client";

import { cn } from "@/lib/utils";

interface PercentileBarProps {
  percentile: number | null;
  className?: string;
}

/**
 * Visual percentile bar
 * Bar fills from left (worst) to right (best)
 * Higher percentile number = better performance (beat more athletes)
 */
export function PercentileBar({ percentile, className }: PercentileBarProps) {
  if (percentile === null) {
    return (
      <div className={cn("space-y-1", className)}>
        <div className="h-2.5 rounded-full bg-muted" />
        <p className="text-xs text-muted-foreground">No score entered</p>
      </div>
    );
  }

  // Fill equals percentile - 90% means you beat 90% of athletes
  const fillPercent = percentile;

  // Color based on performance (higher percentile = better)
  const getBarColor = (p: number) => {
    if (p >= 99) return "bg-blue-700";
    if (p >= 95) return "bg-blue-600";
    if (p >= 90) return "bg-blue-500";
    if (p >= 75) return "bg-green-500";
    if (p >= 50) return "bg-yellow-500";
    if (p >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className={cn("space-y-1", className)}>
      {/* Bar: worst (left/empty) to best (right/filled) */}
      <div className="relative h-2.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "absolute left-0 top-0 h-full rounded-full transition-all duration-300",
            getBarColor(percentile)
          )}
          style={{ width: `${fillPercent}%` }}
        />
      </div>
      {/* Labels */}
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Worst</span>
        <span className={cn("font-medium", getBarColor(percentile).replace("bg-", "text-"))}>
          {percentile}%
        </span>
        <span className="text-muted-foreground">Best</span>
      </div>
    </div>
  );
}
