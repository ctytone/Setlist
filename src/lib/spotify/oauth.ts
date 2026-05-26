import type { getEnv } from "@/lib/env";

export const spotifyOAuthScopes = ["user-library-read", "user-read-private"] as const;

export function buildSpotifyAuthorizeUrl(
  env: Pick<ReturnType<typeof getEnv>, "SPOTIFY_CLIENT_ID" | "SPOTIFY_REDIRECT_URI">,
  state: string,
) {
  const url = new URL("https://accounts.spotify.com/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", env.SPOTIFY_CLIENT_ID);
  url.searchParams.set("scope", spotifyOAuthScopes.join(" "));
  url.searchParams.set("redirect_uri", env.SPOTIFY_REDIRECT_URI);
  url.searchParams.set("state", state);
  url.searchParams.set("show_dialog", "true");

  return url;
}