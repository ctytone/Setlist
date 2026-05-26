import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getEnv } from "@/lib/env";
import { buildSpotifyAuthorizeUrl } from "@/lib/spotify/oauth";

export async function GET() {
  const env = getEnv();
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
