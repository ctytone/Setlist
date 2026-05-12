"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { StarDisplay } from "@/components/star-display";

type RatingDistributionEntry = {
  bucket: number;
  count: number;
};

type Song = {
  id: string;
  name: string;
  duration_ms: number | null;
  artists: Array<{ name: string }> | { name: string } | null;
  album: {
    id: string;
    name: string;
    cover_url: string | null;
  } | null;
};

type RatingDistributionProps = {
  distribution: RatingDistributionEntry[];
  onRatingSelected: (rating: number) => Promise<Song[]>;
};

export function RatingDistribution({ distribution, onRatingSelected }: RatingDistributionProps) {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleRatingClick(rating: number) {
    setSelectedRating(rating);
    setLoading(true);
    try {
      const data = await onRatingSelected(rating);
      setSongs(data);
    } catch (error) {
      console.error("Failed to fetch songs:", error);
      setSongs([]);
    } finally {
      setLoading(false);
    }
  }

  function formatDuration(ms: number | null) {
    if (!ms) return "0:00";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  function getArtistName(
    artists: Array<{ name: string }> | { name: string } | null,
  ): string {
    if (!artists) return "Unknown artist";
    if (Array.isArray(artists)) {
      return artists[0]?.name ?? "Unknown artist";
    }
    return artists.name;
  }

  return (
    <>
      <div className="space-y-2 text-sm">
        {distribution.map((entry) => (
          <button
            key={entry.bucket}
            onClick={() => handleRatingClick(entry.bucket)}
            className="w-full flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted transition-colors text-left"
          >
            <span>{entry.bucket.toFixed(1)} stars</span>
            <span className="text-muted-foreground">{entry.count}</span>
          </button>
        ))}
      </div>

      <Dialog open={selectedRating !== null} onOpenChange={() => setSelectedRating(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <h2 className="text-lg font-semibold">
              Songs rated {selectedRating?.toFixed(1)} stars ({songs.length})
            </h2>
          </DialogHeader>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading songs...</div>
          ) : songs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No songs found</div>
          ) : (
            <div className="space-y-3">
              {songs.map((song) => (
                <div key={song.id} className="flex gap-3 rounded-md border border-border/70 p-3">
                  <div className="flex-shrink-0 w-12 h-12 rounded-md bg-muted overflow-hidden">
                    {song.album?.cover_url ? (
                      <Image
                        src={song.album.cover_url}
                        alt={song.album.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-1">{song.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {getArtistName(song.artists)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {song.album?.name ?? "Unknown album"} • {formatDuration(song.duration_ms)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
