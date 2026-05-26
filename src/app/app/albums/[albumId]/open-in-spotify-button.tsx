"use client";

import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";

export function OpenInSpotifyButton({ spotifyAlbumHref }: { spotifyAlbumHref: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-9 shrink-0 gap-2 px-3"
      onClick={() => {
        window.open(spotifyAlbumHref, "_blank", "noopener,noreferrer");
      }}
    >
      Open in Spotify
      <ExternalLink className="size-4" />
    </Button>
  );
}