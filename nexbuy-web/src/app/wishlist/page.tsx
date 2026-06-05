import type { Metadata } from "next";

export const metadata: Metadata = { title: "願望清單" };

export default function WishlistPage() {
  return (
    <div className="container py-20 text-center">
      <p className="eyebrow mb-3">WISHLIST</p>
      <h1 className="font-serif text-3xl font-medium">願望清單</h1>
      <p className="mt-4 text-muted-foreground">即將推出 — 你收藏的鏡框會出現在這裡。</p>
    </div>
  );
}
