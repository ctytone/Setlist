"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { songRatingSchema, statusSchema } from "@/lib/schemas";
import { fetchSpotifyAlbumDetails, fetchSavedAlbumsPage } from "@/server/spotify";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { recalculateAlbumRating, upsertAlbumGraphForUser } from "@/server/library";
import { requireUser } from "@/server/auth";

function getFormString(formData: FormData, key: string) {
  // Try standard name first
  let value = formData.get(key);
  if (value) return typeof value === "string" ? value : "";
  
  // Next.js 16 form serialization: try numbered variants (1_email, 2_password, etc.)
  for (const [k, v] of formData.entries()) {
    if (k.endsWith(`_${key}`)) {
      return typeof v === "string" ? v : "";
    }
  }
  
  return "";
}

export async function signUpAction(formData: FormData) {
  const supabase = await createServerSupabaseClient();

  const email = getFormString(formData, "email").trim();
  const password = getFormString(formData, "password");

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    redirect(`/auth/sign-up?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/app/albums");
}

export async function signInAction(formData: FormData) {
  const supabase = await createServerSupabaseClient();

  const email = getFormString(formData, "email").trim();
  const password = getFormString(formData, "password");

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/auth/sign-in?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/app/albums");
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function rateSongAction(formData: FormData) {
  const { supabase, user } = await requireUser();

  const raw = {
    trackId: getFormString(formData, "trackId"),
    rating: Number(getFormString(formData, "rating")),
    isPublic: getFormString(formData, "isPublic") !== "false",
  };

  const parsed = songRatingSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Invalid rating payload.");
  }

  await supabase.from("song_ratings").upsert(
    {
      user_id: user.id,
      track_id: parsed.data.trackId,
      rating: parsed.data.rating,
      is_public: parsed.data.isPublic,
      rated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,track_id" },
  );

  const albumId = getFormString(formData, "albumId");
  if (albumId) {
    await recalculateAlbumRating(albumId);
  }

  revalidatePath(`/app/albums/${albumId}`);
  revalidatePath("/app/albums");
}

export async function updateStatusAction(formData: FormData) {
  const { supabase, user } = await requireUser();

  const raw = {
    itemType: getFormString(formData, "itemType"),
    itemId: getFormString(formData, "itemId"),
    status: getFormString(formData, "status"),
  };

  const parsed = statusSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Invalid status payload.");
  }

  await supabase.from("item_statuses").upsert(
    {
      user_id: user.id,
      item_type: parsed.data.itemType,
      item_id: parsed.data.itemId,
      status: parsed.data.status,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,item_type,item_id",
    },
  );

  // Revalidate listing and the specific album page, then navigate
  revalidatePath("/app/albums");
  revalidatePath(`/app/albums/${parsed.data.itemId}`);

  // Redirect back to the album page so the client receives the fresh server render
  redirect(`/app/albums/${parsed.data.itemId}`);
}


export async function addAlbumFromSpotifyAction(formData: FormData) {
  const spotifyAlbumId = getFormString(formData, "spotifyAlbumId");

  if (!spotifyAlbumId) {
    return;
  }

  const details = await fetchSpotifyAlbumDetails(spotifyAlbumId);
  await upsertAlbumGraphForUser(details);

  revalidatePath("/app/albums");
  revalidatePath(`/app/albums`);
}

export async function syncSavedAlbumsAction() {
  const { supabase, user } = await requireUser();

  await supabase.from("sync_state").upsert(
    {
      user_id: user.id,
      status: "running",
      started_at: new Date().toISOString(),
      source: "spotify_saved_albums",
    },
    {
      onConflict: "user_id,source",
    },
  );

  try {
    let imported = 0;

    for (let offset = 0; offset < 200; offset += 20) {
      const page = await fetchSavedAlbumsPage(offset, 20);
      if (!page.items.length) {
        break;
      }

      for (const item of page.items) {
        const fullAlbum = await fetchSpotifyAlbumDetails(item.album.id);
        await upsertAlbumGraphForUser(fullAlbum);
        imported += 1;
      }
    }

    await supabase.from("sync_state").upsert(
      {
        user_id: user.id,
        status: "completed",
        source: "spotify_saved_albums",
        completed_at: new Date().toISOString(),
        imported_count: imported,
        last_error: null,
      },
      {
        onConflict: "user_id,source",
      },
    );
  } catch (error) {
    await supabase.from("sync_state").upsert(
      {
        user_id: user.id,
        status: "failed",
        source: "spotify_saved_albums",
        completed_at: new Date().toISOString(),
        last_error: error instanceof Error ? error.message : "Unknown sync failure",
      },
      {
        onConflict: "user_id,source",
      },
    );

    throw error;
  }

  revalidatePath("/app/albums");
  revalidatePath("/app/settings");
}

export async function deleteAlbumAction(formData: FormData) {
  const { supabase, user } = await requireUser();

  const albumId = getFormString(formData, "albumId");
  if (!albumId) {
    throw new Error("Album ID is required");
  }

  await supabase.from("user_albums").delete().match({
    user_id: user.id,
    album_id: albumId,
  });

  revalidatePath("/app/albums");
  revalidatePath("/app/stats");
  revalidatePath("/app/settings");
}

export async function getSongsByRatingAction(rating: number) {
  const { supabase, user } = await requireUser();

  const { data: ratings, error: ratingsError } = await supabase
    .from("song_ratings")
    .select("track_id,tracks(id,name,duration_ms,artists:primary_artist_id(name))")
    .eq("user_id", user.id)
    .eq("rating", rating)
    .order("rated_at", { ascending: false });

  if (ratingsError) {
    throw new Error(`Failed to fetch songs: ${ratingsError.message}`);
  }

  const trackIds = (ratings ?? []).map((row: any) => row.track_id);

  if (trackIds.length === 0) {
    return [];
  }

  const { data: albumTracks, error: albumError } = await supabase
    .from("album_tracks")
    .select("track_id,albums(id,name,cover_url)")
    .in("track_id", trackIds);

  if (albumError) {
    throw new Error(`Failed to fetch album info: ${albumError.message}`);
  }

  const albumMap = new Map<string, any>();
  (albumTracks ?? []).forEach((row: any) => {
    const album = Array.isArray(row.albums) ? row.albums[0] : row.albums;
    albumMap.set(row.track_id, album);
  });

  return (ratings ?? [])
    .map((row: any) => {
      const track = Array.isArray(row.tracks) ? row.tracks[0] : row.tracks;
      const artists = track?.artists;
      const album = albumMap.get(row.track_id);

      return {
        id: track?.id,
        name: track?.name,
        duration_ms: track?.duration_ms,
        artists,
        album,
      };
    })
    .filter((item) => item.id);
}
