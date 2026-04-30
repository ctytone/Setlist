import { itemTypeValues } from "@/lib/constants";
import { calculateAlbumAverage } from "@/lib/rating";
import type { SpotifyArtist } from "@/lib/types";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireUser } from "@/server/auth";

type SpotifyAlbumPayload = {
  id: string;
  name: string;
  album_type: string;
  release_date: string;
  popularity?: number;
  images: Array<{ url: string }>;
  external_urls?: { spotify?: string | null };
  artists: SpotifyArtist[];
  tracks: {
    items: Array<{
      id: string;
      name: string;
      duration_ms: number;
      track_number: number;
      disc_number: number;
      explicit: boolean;
      preview_url?: string | null;
      artists: SpotifyArtist[];
    }>;
  };
};

function normalizeSpotifyReleaseDate(releaseDate: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(releaseDate)) {
    return releaseDate;
  }

  if (/^\d{4}-\d{2}$/.test(releaseDate)) {
    return `${releaseDate}-01`;
  }

  if (/^\d{4}$/.test(releaseDate)) {
    return `${releaseDate}-01-01`;
  }

  return null;
}

export async function upsertAlbumGraphForUser(album: SpotifyAlbumPayload) {
  const { supabase, user } = await requireUser();
  const serviceRoleClient = createServiceRoleClient();

  const { error: userError } = await serviceRoleClient.from("users").upsert(
    {
      id: user.id,
      handle: user.user_metadata?.user_name ?? null,
      display_name: user.user_metadata?.full_name ?? null,
    },
    { onConflict: "id" },
  );

  if (userError) {
    throw new Error(`Failed to prepare user record: ${userError.message}`);
  }

  for (const artist of album.artists) {
    await serviceRoleClient.from("artists").upsert(
      {
        spotify_id: artist.id,
        name: artist.name,
        popularity: artist.popularity ?? null,
        genres: artist.genres ?? [],
        image_url: artist.images?.[0]?.url ?? null,
      },
      {
        onConflict: "spotify_id",
      },
    );
  }

  const { data: artistRows } = await serviceRoleClient
    .from("artists")
    .select("id,spotify_id")
    .in(
      "spotify_id",
      album.artists.map((artist) => artist.id),
    );

  const primaryArtistId = artistRows?.[0]?.id ?? null;

  const { data: insertedAlbum, error: albumError } = await serviceRoleClient
    .from("albums")
    .upsert(
      {
        spotify_id: album.id,
        name: album.name,
        album_type: album.album_type,
        release_date: normalizeSpotifyReleaseDate(album.release_date),
        popularity: album.popularity ?? null,
        cover_url: album.images[0]?.url ?? null,
        spotify_url: album.external_urls?.spotify ?? null,
        primary_artist_id: primaryArtistId,
      },
      {
        onConflict: "spotify_id",
      },
    )
    .select("id")
    .single();

  if (albumError) {
    throw new Error(`Album upsert failed: ${albumError.message}`);
  }

  if (!insertedAlbum) {
    throw new Error("Failed to upsert album: no data returned.");
  }

  for (const track of album.tracks.items) {
    for (const trackArtist of track.artists) {
      await serviceRoleClient.from("artists").upsert(
        {
          spotify_id: trackArtist.id,
          name: trackArtist.name,
        },
        { onConflict: "spotify_id" },
      );
    }

    const { data: insertedTrack } = await serviceRoleClient
      .from("tracks")
      .upsert(
        {
          spotify_id: track.id,
          name: track.name,
          duration_ms: track.duration_ms,
          explicit: track.explicit,
          spotify_preview_url: track.preview_url ?? null,
          primary_artist_id: primaryArtistId,
        },
        {
          onConflict: "spotify_id",
        },
      )
      .select("id")
      .single();

    if (insertedTrack) {
      await serviceRoleClient.from("album_tracks").upsert(
        {
          album_id: insertedAlbum.id,
          track_id: insertedTrack.id,
          track_number: track.track_number,
          disc_number: track.disc_number,
        },
        {
          onConflict: "album_id,track_id",
        },
      );
    }
  }

  const { error: userAlbumError } = await supabase.from("user_albums").upsert(
    {
      user_id: user.id,
      album_id: insertedAlbum.id,
      source: "spotify",
      imported_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,album_id",
    },
  );

  if (userAlbumError) {
    throw new Error(`Failed to link album to user: ${userAlbumError.message}`);
  }

  return insertedAlbum.id;
}

export async function recalculateAlbumRating(albumId: string) {
  const { supabase, user } = await requireUser();

  const { data: ratings } = await supabase
    .from("song_ratings")
    .select("rating")
    .eq("user_id", user.id)
    .in(
      "track_id",
      (
        await supabase
          .from("album_tracks")
          .select("track_id")
          .eq("album_id", albumId)
      ).data?.map((entry) => entry.track_id) ?? [],
    );

  const average = calculateAlbumAverage((ratings ?? []).map((entry) => Number(entry.rating)));

  await supabase.from("user_albums").upsert(
    {
      user_id: user.id,
      album_id: albumId,
      derived_rating: average,
      source: "manual",
    },
    {
      onConflict: "user_id,album_id",
    },
  );

  return average;
}

export function assertItemType(type: string): type is (typeof itemTypeValues)[number] {
  return itemTypeValues.includes(type as (typeof itemTypeValues)[number]);
}
