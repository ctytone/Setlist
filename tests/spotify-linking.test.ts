import { describe, expect, it } from "vitest";

import { isSpotifyLinkingAllowed } from "@/lib/spotify/linking";

describe("Spotify linking allowlist", () => {
  it("allows configured admin emails regardless of case and separator", () => {
    expect(isSpotifyLinkingAllowed("Admin@Example.com", "admin@example.com")).toBe(true);
    expect(isSpotifyLinkingAllowed("owner@example.com", "admin@example.com, owner@example.com")).toBe(true);
    expect(isSpotifyLinkingAllowed("owner@example.com", "admin@example.com; owner@example.com")).toBe(true);
  });

  it("rejects everyone else", () => {
    expect(isSpotifyLinkingAllowed("user@example.com", "admin@example.com")).toBe(false);
    expect(isSpotifyLinkingAllowed(null, "admin@example.com")).toBe(false);
    expect(isSpotifyLinkingAllowed("user@example.com", "")).toBe(false);
  });
});