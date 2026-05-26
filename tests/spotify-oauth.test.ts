import { describe, expect, it } from "vitest";

import { buildSpotifyAuthorizeUrl, spotifyOAuthScopes } from "@/lib/spotify/oauth";

describe("Spotify OAuth", () => {
  it("requests only read-only scopes needed for library sync", () => {
    expect(spotifyOAuthScopes).toEqual(["user-library-read", "user-read-private"]);
    expect(spotifyOAuthScopes).not.toContain("user-read-email");
  });

  it("builds the authorize URL without write scopes", () => {
    const url = buildSpotifyAuthorizeUrl(
      {
        SPOTIFY_CLIENT_ID: "client-id",
        SPOTIFY_REDIRECT_URI: "https://example.com/api/spotify/oauth/callback",
      },
      "state-value",
    );

    expect(url.toString()).toContain("scope=user-library-read+user-read-private");
    expect(url.toString()).not.toContain("user-read-email");
  });
});