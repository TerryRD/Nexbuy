import type { Metadata } from "next";
import { createServerSupabase } from "@/lib/supabase/server";
import { getWishlistProductIds } from "@/lib/wishlist";
import { QuizClient } from "./QuizClient";

export const metadata: Metadata = { title: "臉型測驗" };

export default async function QuizPage() {
  const sb = await createServerSupabase();
  const [{ data }, wishlistSet, { data: { user } }] = await Promise.all([
    sb
      .from("products")
      .select(
        "id, slug, name, price_cents, image_urls, kind, finished_stock, is_online_available, face_shape, frame_shape",
      )
      .eq("is_online_available", true)
      .limit(60),
    getWishlistProductIds(),
    sb.auth.getUser(),
  ]);

  return (
    <div className="container py-10 md:py-14">
      <QuizClient
        products={data ?? []}
        wishlistIds={Array.from(wishlistSet)}
        isLoggedIn={!!user}
      />
    </div>
  );
}
