import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    // Whitelist hosts for next/image. Supabase Storage is the primary path
    // (admin-uploaded product images); Unsplash is allowed for demo seed
    // product photos and can be removed once real photos are uploaded.
    remotePatterns: [
      supabaseHost
        ? { protocol: "https" as const, hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }
        : { protocol: "https" as const, hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
