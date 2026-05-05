import type { MetadataRoute } from "next";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { publicEnv } from "@/lib/env";

// 動態 sitemap：靜態核心頁 + 全部上架（且未軟刪）的商品 detail page。
// 用 admin client 繞 RLS 但只 select 公開欄位，沒有資料外洩風險。
//
// changeFrequency / priority 走 Google 建議：商品 weekly + priority 0.8，
// 首頁 daily + 1.0，登入註冊類 monthly + 0.3。

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    {
      url: `${base}/products?kind=finished`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${base}/products?kind=prescription_frame`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    { url: `${base}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/signup`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    {
      url: `${base}/forgot-password`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  // 動態：商品列表
  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const admin = createAdminSupabase();
    const { data, error } = await admin
      .from("products")
      .select("slug, updated_at")
      .eq("is_online_available", true)
      .is("deleted_at", null)
      .limit(5000);

    if (!error && data) {
      productEntries = data.map((p) => ({
        url: `${base}/products/${p.slug as string}`,
        lastModified: new Date((p.updated_at as string) ?? now),
        changeFrequency: "weekly",
        priority: 0.8,
      }));
    }
  } catch (err) {
    // 抓不到不影響靜態 entries — sitemap 還是會生成
    console.error("[sitemap] product fetch failed:", err);
  }

  return [...staticEntries, ...productEntries];
}
