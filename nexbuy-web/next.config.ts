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
    // AVIF 比 WebP 再小 ~25%；Chromium / Safari 16+ 支援。Next.js 自動依
    // Accept header 退到 WebP / 原圖。
    formats: ["image/avif", "image/webp"],
    // 30 天 — 商品照變動慢，cache 久一點降低 Vercel image transform 用量。
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  // 拿掉 X-Powered-By: Next.js header — security-through-obscurity 但無害
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
