import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("security migrations", () => {
  it("does not grant authenticated users write access to the shared Spotify catalog", () => {
    const migration = readFileSync("supabase/migrations/0001_init.sql", "utf8");

    expect(migration).not.toContain("artists_write_authenticated");
    expect(migration).not.toContain("albums_write_authenticated");
    expect(migration).not.toContain("tracks_write_authenticated");
    expect(migration).not.toContain("album_tracks_write_authenticated");
  });

  it("drops the legacy catalog write policies and revokes direct writes", () => {
    const migration = readFileSync("supabase/migrations/0004_harden_security.sql", "utf8");

    expect(migration).toContain('drop policy if exists "artists_write_authenticated"');
    expect(migration).toContain("revoke insert, update, delete on table public.albums from authenticated");
  });
});