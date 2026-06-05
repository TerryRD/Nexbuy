import type { Metadata } from "next";

export const metadata: Metadata = { title: "門市資訊" };

export default function StorePage() {
  return (
    <div className="container py-20 text-center">
      <p className="eyebrow mb-3">OUR STORE</p>
      <h1 className="font-serif text-3xl font-medium">門市資訊</h1>
      <p className="mt-4 text-muted-foreground">即將推出 — 桃園市桃園區同德里中埔六街 95 號。</p>
    </div>
  );
}
