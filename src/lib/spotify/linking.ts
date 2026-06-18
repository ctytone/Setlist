import { getEnv } from "@/lib/env";

function parseAdminEmails(rawEmails: string) {
  return new Set(
    rawEmails
      .split(/[,;\n]/)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isSpotifyLinkingAllowed(email: string | null | undefined, adminEmails: string) {
  if (!email) {
    return false;
  }

  const allowedEmails = parseAdminEmails(adminEmails);
  return allowedEmails.has(email.trim().toLowerCase());
}

export function canUseSpotifyLinking(email: string | null | undefined) {
  const env = getEnv();
  return isSpotifyLinkingAllowed(email, env.SPOTIFY_LINK_ADMIN_EMAILS);
}