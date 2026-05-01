"use client";

import React from "react";
import { RatingStars } from "./rating-stars";

export function SongRatingForm({ trackId, albumId, initialRating }: { trackId: string; albumId?: string; initialRating?: number | null }) {
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
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

      const json = await res.json();
      // Notify listeners (e.g., LiveAlbumAverage) about updated average
      window.dispatchEvent(new CustomEvent("album-average-updated", { detail: { albumId: payload.albumId, average: json.average } }));
    } catch (err) {
      console.error("Failed to submit rating", err);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <input type="hidden" name="trackId" value={trackId} />
      {albumId ? <input type="hidden" name="albumId" value={albumId} /> : null}
      <RatingStars name="rating" value={initialRating ?? null} />
    </form>
  );
}

export default SongRatingForm;
