"use client";

import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";

export function OpenInSpotifyButton({ spotifyAlbumHref }: { spotifyAlbumHref: string }) {
  function launchSpotify() {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = spotifyAlbumHref;
    document.body.appendChild(iframe);

    window.setTimeout(() => {
      iframe.remove();
    }, 2000);
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="h-9 shrink-0 gap-2 px-3"
      onClick={launchSpotify}
    >
      Open in Spotify
      <ExternalLink className="size-4" />
    </Button>
  );
}