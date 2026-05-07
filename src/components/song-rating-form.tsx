"use client";

import React from "react";
import { RatingStars } from "./rating-stars";

export function SongRatingForm({
  trackId,
  albumId,
  initialRating,
  onRatingChange,
}: {
  trackId: string;
  albumId?: string;
  initialRating?: number | null;
  onRatingChange?: (rating: number | null) => void;
}) {
  const [rating, setRating] = React.useState<number | null>(initialRating ?? null);

  React.useEffect(() => {
    setRating(initialRating ?? null);
  }, [initialRating]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const formData = submitter ? new FormData(form, submitter) : new FormData(form);
    if (submitter?.name && submitter.value && !formData.has(submitter.name)) {
      formData.append(submitter.name, submitter.value);
    }

    const clickedRatingRaw = formData.get("rating");
    const clickedRating = Number(clickedRatingRaw);
    const previousRating = rating;
    const shouldClear =
      Number.isFinite(clickedRating) &&
      rating !== null &&
      Number(clickedRating.toFixed(1)) === Number(rating.toFixed(1));

    if (shouldClear) {
      formData.set("clear", "true");
      setRating(null);
      onRatingChange?.(null);
    } else if (Number.isFinite(clickedRating)) {
      setRating(clickedRating);
      onRatingChange?.(clickedRating);
    }

    const payload: any = {};
    for (const [k, v] of formData.entries()) {
      payload[k] = v;
    }

    try {
      const res = await fetch("/api/rate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Failed to save rating (${res.status})`);
      }

      const json = await res.json();
      // Notify listeners (e.g., LiveAlbumAverage) about updated average
      window.dispatchEvent(new CustomEvent("album-average-updated", { detail: { albumId: payload.albumId, average: json.average } }));
    } catch (err) {
      setRating(previousRating);
      onRatingChange?.(previousRating);
      console.error("Failed to submit rating", err);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <input type="hidden" name="trackId" value={trackId} />
      {albumId ? <input type="hidden" name="albumId" value={albumId} /> : null}
      <RatingStars name="rating" value={rating} />
    </form>
  );
}

export default SongRatingForm;
