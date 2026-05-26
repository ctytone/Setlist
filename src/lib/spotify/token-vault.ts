import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { getEnv } from "@/lib/env";

const TOKEN_PREFIX = "enc:v1";

function getEncryptionKey() {
  const env = getEnv();
  return createHash("sha256").update(env.SPOTIFY_CLIENT_SECRET).digest();
}

export function encryptSpotifyToken(token: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    TOKEN_PREFIX,
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

export function decryptSpotifyToken(token: string) {
  if (!token.startsWith(`${TOKEN_PREFIX}:`)) {
    return token;
  }

  const [prefix, version, ivBase64, authTagBase64, ...encryptedParts] = token.split(":");

  if (prefix !== "enc" || version !== "v1" || !ivBase64 || !authTagBase64 || encryptedParts.length === 0) {
    throw new Error("Invalid encrypted Spotify token format.");
  }

  const encryptedBase64 = encryptedParts.join(":");

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivBase64, "base64"),
    { authTagLength: 16 },
  );
  decipher.setAuthTag(Buffer.from(authTagBase64, "base64"));

  try {
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedBase64, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new Error("Unable to decrypt Spotify token stored in the database.");
  }
}

export function isEncryptedSpotifyToken(token: string) {
  return token.startsWith(`${TOKEN_PREFIX}:`);
}