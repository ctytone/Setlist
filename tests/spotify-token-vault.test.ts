import { describe, expect, it } from "vitest";

import { decryptSpotifyToken, encryptSpotifyToken, isEncryptedSpotifyToken } from "@/lib/spotify/token-vault";

process.env.NODE_ENV = "test";
process.env.NEXT_PUBLIC_APP_URL = "https://example.com";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.example.com";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
process.env.SPOTIFY_CLIENT_ID = "spotify-client-id";
process.env.SPOTIFY_CLIENT_SECRET = "spotify-client-secret";
process.env.SPOTIFY_REDIRECT_URI = "https://example.com/api/spotify/oauth/callback";

describe("Spotify token vault", () => {
  it("round-trips encrypted tokens", () => {
    const encrypted = encryptSpotifyToken("refresh-token-value");

    expect(isEncryptedSpotifyToken(encrypted)).toBe(true);
    expect(decryptSpotifyToken(encrypted)).toBe("refresh-token-value");
  });

  it("preserves legacy plaintext tokens during migration", () => {
    expect(isEncryptedSpotifyToken("plain-token")).toBe(false);
    expect(decryptSpotifyToken("plain-token")).toBe("plain-token");
  });
});