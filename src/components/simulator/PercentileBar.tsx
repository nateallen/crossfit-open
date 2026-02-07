"use client";

import { cn } from "@/lib/utils";

interface PercentileBarProps {
  percentile: number | null;
  isLoading?: boolean;
  className?: string;
}

/**
 * Visual percentile bar
 * Bar fills from left (worst) to right (best)
 * Higher percentile number = better performance (beat more athletes)
 */
export function PercentileBar({ percentile, isLoading = false, className }: PercentileBarProps) {
  if (isLoading) {
    return (
      <div className={cn("space-y-1", className)}>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full w-full bg-muted-foreground/20 animate-pulse rounded-full" />
        </div>
        <p className="text-xs text-muted-foreground animate-pulse">Looking up percentile...</p>
      </div>
    );
  }

  if (percentile === null) {
    return (
      <div className={cn("space-y-1", className)}>
        <div className="h-2.5 rounded-full bg-muted" />
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
      {/* Bar fills from left to right based on percentile */}
      <div className="relative h-2.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "absolute left-0 top-0 h-full rounded-full transition-all duration-300",
            getBarColor(percentile)
          )}
          style={{ width: `${fillPercent}%` }}
        />
      </div>
      {/* Label */}
      <div className="flex justify-end text-xs">
        <span className={cn("font-medium", getBarColor(percentile).replace("bg-", "text-"))}>
          {percentile}%
        </span>
      </div>
    </div>
  );
}
