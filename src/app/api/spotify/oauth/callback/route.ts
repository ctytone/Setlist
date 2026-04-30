import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { fetchSpotifyToken } from "@/lib/spotify/client";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();

  const expectedState = cookieStore.get("spotify_oauth_state")?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/app/settings?spotify=invalid_state", request.url));
  }

  cookieStore.delete("spotify_oauth_state");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  try {
    const token = await fetchSpotifyToken(code);

    const profileResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
      },
      cache: "no-store",
    });

    if (!profileResponse.ok) {
      throw new Error("Could not fetch Spotify profile.");
    }

    const profile = (await profileResponse.json()) as {
      id: string;
      display_name?: string;
      email?: string;
      product?: string;
    };

  console.log("[Spotify callback] Profile fetched:", profile);
  console.log("[Spotify callback] User ID:", user.id);

  // Use service role client to bypass RLS for this privileged operation
  const serviceRoleClient = createServiceRoleClient();
  const { error, data } = await serviceRoleClient.from("spotify_accounts").upsert(
      {
        user_id: user.id,
        spotify_user_id: profile.id,
        spotify_display_name: profile.display_name ?? null,
        spotify_email: profile.email ?? null,
        spotify_product: profile.product ?? null,
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        expires_at: new Date(Date.now() + token.expires_in * 1000).toISOString(),
        scopes: token.scope,
      },
      { onConflict: "user_id" },
    );

    if (error) {
      console.error("[Spotify callback] Upsert error:", error);
      throw error;
    }

    console.log("[Spotify callback] Upsert success:", data);

    return NextResponse.redirect(new URL("/app/settings?spotify=linked", request.url));
  } catch {
      } catch (error) {
        console.error("[Spotify callback] Error:", error);
    return NextResponse.redirect(new URL("/app/settings?spotify=failed", request.url));
  }
}
