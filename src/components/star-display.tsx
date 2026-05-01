"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Displays a row of stars for a given rating value.
 * Does not support interaction - purely for display.
 * Rounds the value to nearest 0.5.
 */
export function StarDisplay({ value }: { value: number | null }) {
  if (value === null) {
    return <div className="text-muted-foreground">—</div>;
  }

  // Round to nearest 0.5
  const rounded = Math.round(value * 2) / 2;

  return (
    <div className="flex items-center gap-1">
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
            <div className="relative w-6 h-6">
              <Star className="absolute inset-0 h-6 w-6 text-muted-foreground" />
              <div
                className="absolute left-0 top-0 h-6 overflow-hidden"
                style={{ width: `${fill}%` }}
              >
                <Star className="h-6 w-6 text-yellow-400 fill-current" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default StarDisplay;
