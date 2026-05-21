import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

const supabaseImageHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return null;
  }
})();

const spotifyImagePattern: RemotePattern = {
  protocol: "https",
  hostname: "i.scdn.co",
};

const supabaseImagePattern: RemotePattern | null = supabaseImageHost
  ? {
      protocol: "https",
      hostname: supabaseImageHost,
      pathname: "/storage/v1/object/public/**",
    }
  : null;

const remotePatterns: RemotePattern[] = [
  spotifyImagePattern,
  ...(supabaseImagePattern ? [supabaseImagePattern] : []),
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
  allowedDevOrigins: ["proponent-jaybird-finalize.ngrok-free.dev"],
};

export default nextConfig;
