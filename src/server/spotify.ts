import { albumDetailsSchema, savedAlbumsSchema } from "@/lib/spotify/schemas";
import { decryptSpotifyToken, encryptSpotifyToken, isEncryptedSpotifyToken } from "@/lib/spotify/token-vault";
import { refreshSpotifyToken, spotifyFetch } from "@/lib/spotify/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireUser } from "@/server/auth";

async function getValidSpotifyAccessToken() {
  const { supabase, user } = await requireUser();

  const { data: account } = await supabase
    .from("spotify_accounts")
    .select("id,spotify_user_id,access_token,refresh_token,expires_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!account) {
    throw new Error("Spotify account not linked.");
  }

  const accessToken = decryptSpotifyToken(account.access_token);
  const refreshToken = decryptSpotifyToken(account.refresh_token);

  if (!isEncryptedSpotifyToken(account.access_token) || !isEncryptedSpotifyToken(account.refresh_token)) {
    await supabase
      .from("spotify_accounts")
      .update({
        access_token: encryptSpotifyToken(accessToken),
        refresh_token: encryptSpotifyToken(refreshToken),
        updated_at: new Date().toISOString(),
      })
      .eq("id", account.id)
      .eq("user_id", user.id);
  }

  const expiresAt = account.expires_at ? new Date(account.expires_at) : null;
  const isExpired = expiresAt ? expiresAt.getTime() <= Date.now() + 60_000 : true;

  if (!isExpired) {
    return { accessToken, supabase, userId: user.id };
  }

  const refreshed = await refreshSpotifyToken(refreshToken);
  const nextExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

  await supabase
    .from("spotify_accounts")
    .update({
      access_token: encryptSpotifyToken(refreshed.access_token),
      refresh_token: encryptSpotifyToken(refreshed.refresh_token ?? refreshToken),
      expires_at: nextExpiry,
      scopes: refreshed.scope,
      updated_at: new Date().toISOString(),
    })
    .eq("id", account.id);

  return { accessToken: refreshed.access_token, supabase, userId: user.id };
}

export async function fetchSpotifyAlbumDetails(albumId: string) {
  const { accessToken } = await getValidSpotifyAccessToken();
  return spotifyFetch(`/albums/${albumId}`, accessToken, albumDetailsSchema);
}

export async function fetchSavedAlbumsPage(offset = 0, limit = 20) {
  const { accessToken } = await getValidSpotifyAccessToken();
  return spotifyFetch(
    `/me/albums?limit=${limit}&offset=${offset}`,
    accessToken,
    savedAlbumsSchema,
  );
}

export async function getSpotifyTokenForUser() {
  return getValidSpotifyAccessToken();
}

export async function getPublicSpotifyAlbum(albumId: string, accessToken: string) {
  return spotifyFetch(`/albums/${albumId}`, accessToken, albumDetailsSchema);
}

export async function getServerSupabaseClient() {
  return createServerSupabaseClient();
}
