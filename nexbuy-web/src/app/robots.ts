import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

// /robots.txt — 公開頁面允許爬，admin / account / api / 個人化 page 全部擋。

export default function robots(): MetadataRoute.Robots {
  const base = publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/account",
          "/account/",
          "/api/",
          "/auth/",
          "/cart",
          "/checkout",
          "/orders/",
          "/appointment/", // 個人預約取消 token 連結，不要被搜
          "/compare",      // 個人 client-state，不該被索引
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
