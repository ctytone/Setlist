import type { NextConfig } from "next";

const supabaseImageHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.scdn.co",
      },
      ...(supabaseImageHost
        ? [
            {
              protocol: "https",
              hostname: supabaseImageHost,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
    ],
  },
  allowedDevOrigins: ["proponent-jaybird-finalize.ngrok-free.dev"],
};

export default nextConfig;
