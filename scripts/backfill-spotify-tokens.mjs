import { createClient } from "@supabase/supabase-js";
import { createCipheriv, createHash, randomBytes } from "node:crypto";

const requiredEnvKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SPOTIFY_CLIENT_SECRET",
];

for (const key of requiredEnvKeys) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);

function getEncryptionKey() {
  return createHash("sha256").update(process.env.SPOTIFY_CLIENT_SECRET).digest();
}

function encryptSpotifyToken(token) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return ["enc", "v1", iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(":");
}

function isEncryptedSpotifyToken(token) {
  return typeof token === "string" && token.startsWith("enc:v1:");
}

async function main() {
  const batchSize = 100;
  let offset = 0;
  let scanned = 0;
  let updated = 0;

  while (true) {
    const { data, error } = await supabase
      .from("spotify_accounts")
      .select("id,user_id,access_token,refresh_token")
      .order("created_at", { ascending: true })
      .range(offset, offset + batchSize - 1);

    if (error) {
      throw error;
    }

    const rows = data ?? [];

    if (rows.length === 0) {
      break;
    }

    scanned += rows.length;

    for (const row of rows) {
      const accessToken = row.access_token ?? "";
      const refreshToken = row.refresh_token ?? "";

      const nextAccessToken = isEncryptedSpotifyToken(accessToken) ? accessToken : encryptSpotifyToken(accessToken);
      const nextRefreshToken = isEncryptedSpotifyToken(refreshToken) ? refreshToken : encryptSpotifyToken(refreshToken);

      if (nextAccessToken === accessToken && nextRefreshToken === refreshToken) {
        continue;
      }

      const { error: updateError } = await supabase
        .from("spotify_accounts")
        .update({
          access_token: nextAccessToken,
          refresh_token: nextRefreshToken,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id)
        .eq("user_id", row.user_id);

      if (updateError) {
        throw updateError;
      }

      updated += 1;
      console.log(`Re-encrypted Spotify tokens for account ${row.id}`);
    }

    offset += batchSize;
  }

  console.log(`Done. Scanned ${scanned} Spotify account rows, updated ${updated}.`);
}

main().catch((error) => {
  console.error("Spotify token backfill failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});