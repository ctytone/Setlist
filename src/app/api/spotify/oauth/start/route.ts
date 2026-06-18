import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getEnv } from "@/lib/env";
import { canUseSpotifyLinking } from "@/lib/spotify/linking";
import { buildSpotifyAuthorizeUrl } from "@/lib/spotify/oauth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const env = getEnv();
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth/sign-in", env.NEXT_PUBLIC_APP_URL));
  }

  if (!canUseSpotifyLinking(user.email)) {
    return NextResponse.redirect(new URL("/app/settings?spotify=disabled", env.NEXT_PUBLIC_APP_URL));
  }

  const state = crypto.randomUUID();
  const cookieStore = await cookies();

  cookieStore.set("spotify_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: 60 * 10,
    path: "/",
  });

  const url = buildSpotifyAuthorizeUrl(env, state);

  return NextResponse.redirect(url.toString());
}
