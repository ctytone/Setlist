"use client";

import { useState } from "react";
import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * 5-star widget that supports half-star ratings (0.5 steps).
 * - `value` is the current rating (null or number between 0.5 and 5.0)
 * - If `name` is provided, each half/full segment is rendered as a submit button
 *   so clicking it will submit a form with that `name` and value (e.g. "3.5").
 */
export function RatingStars({ value, name }: { value: number | null; name?: string }) {
  const [hover, setHover] = useState<number | null>(null);

  const current = hover ?? value ?? 0;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, idx) => {
        const star = idx + 1;
        // Determine fill percent for this star based on `current` (0, 50, 100)
        let fill = 0;
        if (current >= star) {
          fill = 100;
        } else if (current >= star - 0.5) {
          fill = 50;
        }

        const fullValue = star;
        const halfValue = Number((star - 0.5).toFixed(1));

        return (
          <div key={star} className="relative inline-flex items-center">
            <div className="relative w-6 h-6">
              <Star className="absolute inset-0 h-6 w-6 text-muted-foreground" />
              <div
                className="absolute left-0 top-0 h-6 overflow-hidden"
                style={{ width: `${fill}%` }}
              >
                <Star className="h-6 w-6 text-muted-foreground fill-yellow-400" />
              </div>
            </div>

            {/* Left half button (half star) */}
            <button
              type={name ? "submit" : "button"}
              name={name}
              value={String(halfValue)}
              onMouseEnter={() => setHover(halfValue)}
              onMouseLeave={() => setHover(null)}
              aria-label={`Rate ${halfValue} stars`}
              className={cn(
                "absolute left-0 top-0 h-6 w-3 bg-transparent",
                name ? "" : "cursor-pointer",
              )}
            />

            {/* Right half button (full star) */}
            <button
              type={name ? "submit" : "button"}
              name={name}
              value={String(fullValue)}
              onMouseEnter={() => setHover(fullValue)}
              onMouseLeave={() => setHover(null)}
              aria-label={`Rate ${fullValue} stars`}
              className={cn(
                "absolute right-0 top-0 h-6 w-3 bg-transparent",
                name ? "" : "cursor-pointer",
              )}
            />
          </div>
        );
      })}
    </div>
  );
}
