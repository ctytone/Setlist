"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Displays a row of stars for a given rating value.
 * Does not support interaction - purely for display.
 * Rounds the value to nearest 0.5.
 */
export function StarDisplay({
  value,
  size = "md",
}: {
  value: number | null;
  size?: "sm" | "md";
}) {
  if (value === null) {
    return <div className="text-muted-foreground">—</div>;
  }

  // Round to nearest 0.5
  const rounded = Math.round(value * 2) / 2;
  const iconSize = size === "sm" ? "h-4 w-4" : "h-6 w-6";
  const gap = size === "sm" ? "gap-0.5" : "gap-1";

  return (
    <div className={cn("flex items-center", gap)}>
      {Array.from({ length: 5 }, (_, idx) => {
        const star = idx + 1;
        let fill = 0;
        if (rounded >= star) {
          fill = 100;
        } else if (rounded >= star - 0.5) {
          fill = 50;
        }

        return (
          <div key={star} className="relative inline-flex items-center">
            <div className={cn("relative", iconSize)}>
              <Star className={cn("absolute inset-0 text-muted-foreground", iconSize)} />
              <div
                className={cn("absolute left-0 top-0 overflow-hidden", iconSize)}
                style={{ width: `${fill}%` }}
              >
                <Star className={cn("text-yellow-400 fill-current", iconSize)} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default StarDisplay;
