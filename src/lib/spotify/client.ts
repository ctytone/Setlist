import { z } from "zod";

import { getEnv } from "@/lib/env";

const spotifyErrorSchema = z.object({
  error: z.object({
    status: z.number(),
    message: z.string(),
  }),
});

export async function spotifyFetch<T>(
  endpoint: string,
  accessToken: string,
  schema: z.ZodSchema<T>,
) {
  const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    next: {
      revalidate: 0,
    },
  });

  const json = await response.json();

  if (!response.ok) {
    const parsedError = spotifyErrorSchema.safeParse(json);
    if (parsedError.success) {
      throw new Error(parsedError.data.error.message);
    }

    throw new Error("Spotify API request failed.");
  }

  return schema.parse(json);
}

export async function fetchSpotifyToken(code: string) {
  const env = getEnv();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: env.SPOTIFY_REDIRECT_URI,
  });

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`).toString(
          "base64",
        ),
    },
    body,
  });

  if (!response.ok) {
    throw new Error("Failed to exchange Spotify OAuth code.");
  }

  return response.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
  }>;
}

export async function refreshSpotifyToken(refreshToken: string) {
  const env = getEnv();
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`).toString(
          "base64",
        ),
    },
    body,
  });

  if (!response.ok) {
    throw new Error("Failed to refresh Spotify access token.");
  }

  return response.json() as Promise<{
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    scope: string;
    token_type: string;
  }>;
}
