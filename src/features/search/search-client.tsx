"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { addAlbumFromSpotifyAction } from "@/server/actions/app-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SpotifyAlbumResult = {
  id: string;
  name: string;
  release_date: string;
  album_type: string;
  images: Array<{ url: string }>;
  artists: Array<{ name: string }>;
};

type SpotifyArtistResult = {
  id: string;
  name: string;
  images?: Array<{ url: string }>;
  genres?: string[];
};

type SearchResult =
  | { kind: "album"; item: SpotifyAlbumResult }
  | { kind: "artist"; item: SpotifyArtistResult };

export function SearchClient() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("album");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function readErrorMessage(response: Response) {
    const responseText = await response.text();

    if (!responseText) {
      return response.statusText || "Search failed";
    }

    try {
      const json = JSON.parse(responseText) as { error?: string };
      return json.error ?? response.statusText ?? "Search failed";
    } catch {
      return responseText;
    }
  }

  async function onSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!query.trim()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        query,
        type,
      });

      const response = await fetch(`/api/spotify/search?${params.toString()}`);

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const json = (await response.json()) as {
        albums?: { items?: SpotifyAlbumResult[] };
        artists?: { items?: SpotifyArtistResult[] };
      };

      if (type === "artist") {
        setResults((json.artists?.items ?? []).map((item) => ({ kind: "artist", item })));
      } else {
        setResults((json.albums?.items ?? []).map((item) => ({ kind: "album", item })));
      }
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onSearch} className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search albums on Spotify"
        />
        <Select value={type} onValueChange={(value) => setType(value ?? "album")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="album">Albums</SelectItem>
            <SelectItem value="artist">Artists</SelectItem>
            <SelectItem value="track">Tracks</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </form>

      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((result) => {
          if (result.kind === "artist") {
            const artist = result.item;

            return (
              <Card key={artist.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="aspect-square overflow-hidden rounded-md bg-muted">
                    {artist.images?.[0]?.url ? (
                      <Image
                        src={artist.images[0].url}
                        alt={artist.name}
                        width={300}
                        height={300}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div>
                    <p className="line-clamp-1 text-sm font-semibold">{artist.name}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {artist.genres?.length ? artist.genres.join(", ") : "Artist"}
                    </p>
                  </div>
                  <Button asChild className="w-full" size="sm">
                    <Link href={`/app/artists/${artist.id}`}>View artist</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          }

          const album = result.item;

          return (
            <Card key={album.id}>
              <CardContent className="space-y-3 p-4">
                <div className="aspect-square overflow-hidden rounded-md bg-muted">
                  {album.images[0]?.url ? (
                    <Image
                      src={album.images[0].url}
                      alt={album.name}
                      width={300}
                      height={300}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div>
                  <p className="line-clamp-1 text-sm font-semibold">{album.name}</p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {album.artists.map((artist) => artist.name).join(", ")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {album.release_date || "Unknown date"}
                  </p>
                </div>
                <form action={addAlbumFromSpotifyAction}>
                  <input type="hidden" name="spotifyAlbumId" value={album.id} />
                  <Button type="submit" className="w-full" size="sm">
                    Add album
                  </Button>
                </form>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
