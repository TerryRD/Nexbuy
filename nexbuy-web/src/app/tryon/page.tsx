import { Suspense } from "react";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Product } from "@/lib/types/database";
import { TryOnClient } from "./TryOnClient";

export const metadata = {
  title: "虛擬試戴 | Nexbuy",
  description: "上傳一張正面自拍,看眼鏡商品戴在你臉上的效果。",
};

export default async function TryOnPage() {
  const sb = await createServerSupabase();
  const { data, error } = await sb
    .from("products")
    .select(
      "id, slug, name, description, price_cents, image_urls, brand, kind, finished_stock, is_online_available, face_shape, frame_shape, frame_size, material, color, try_on_image_url",
    )
    .not("try_on_image_url", "is", null)
    .eq("is_online_available", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("tryon page load failed:", error);
    throw new Error("Failed to load products");
  }

  const products = (data ?? []) as Product[];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <header className="mb-6">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          虛擬試戴
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          上傳一張清楚的正臉照（五官明顯、光線明亮），選一副眼鏡看試戴效果。
        </p>
      </header>

      <Suspense fallback={<p className="text-muted-foreground">載入中…</p>}>
        <TryOnClient products={products} />
      </Suspense>
    </div>
  );
}
