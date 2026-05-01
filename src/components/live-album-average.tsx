"use client";

import { useEffect, useState } from "react";

export function LiveAlbumAverage({ albumId }: { albumId: string }) {
  const [average, setAverage] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchAvg() {
      try {
        const res = await fetch(`/api/album/${albumId}/average`);
        const json = await res.json();
        if (mounted) setAverage(json.average ?? null);
      } catch (err) {
        console.error("failed to load album average", err);
      }
    }

    fetchAvg();

    function onUpdate(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail?.albumId === albumId) {
        setAverage(detail.average ?? null);
      }
    }

    window.addEventListener("album-average-updated", onUpdate as EventListener);

    return () => {
      mounted = false;
      window.removeEventListener("album-average-updated", onUpdate as EventListener);
    };
  }, [albumId]);

  return (
    <div className="w-full rounded-md border border-red-500 p-4">
      <h3 className="text-sm font-medium text-muted-foreground">Live album average</h3>
      <div className="mt-2 text-4xl font-heading">
        {average !== null ? `${Number(average).toFixed(2)} ★` : "—"}
      </div>
    </div>
  );
}

export default LiveAlbumAverage;
