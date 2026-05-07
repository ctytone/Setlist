"use client";

import React from "react";

import SongRatingForm from "@/components/song-rating-form";
import { Badge } from "@/components/ui/badge";

function getRatingColor(rating: number | null) {
  if (rating === null) {
    return null;
  }

  const clamped = Math.max(0, Math.min(5, rating));
  const hue = (clamped / 5) * 120;
  return `hsl(${hue} 72% 42%)`;
}

export default function SongRatingCell({
  trackId,
  albumId,
  initialRating,
}: {
  trackId: string;
  albumId: string;
  initialRating?: number | null;
}) {
  const [rating, setRating] = React.useState<number | null>(initialRating ?? null);
  const ratingColor = getRatingColor(rating);

  return (
    <div className="grid grid-cols-[auto_136px] items-center justify-end gap-3">
      <Badge
        variant={ratingColor ? "outline" : "secondary"}
        className="h-8 rounded-full px-3 text-sm font-semibold"
        style={
          ratingColor
            ? {
                backgroundColor: ratingColor,
                borderColor: ratingColor,
                color: "hsl(0 0% 100%)",
              }
            : undefined
        }
      >
        {rating ? `${rating.toFixed(1)} stars` : "Not listened to yet"}
      </Badge>

      <div className="w-[136px] shrink-0 flex justify-end">
        <SongRatingForm
          trackId={trackId}
          albumId={albumId}
          initialRating={rating}
          onRatingChange={setRating}
        />
      </div>
    </div>
  );
}
