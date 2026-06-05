import type { Metadata } from "next";
import Link from "next/link";
import { StoreInfoCard } from "@/components/site/StoreInfoCard";

export const metadata: Metadata = { title: "門市資訊" };

export default function StorePage() {
  return (
    <div className="container py-12 md:py-16">
      <header className="mb-8 text-center">
        <p className="eyebrow mb-2">OUR STORE</p>
        <h1 className="font-serif text-3xl font-medium md:text-4xl">門市資訊</h1>
        <p className="mt-3 text-muted-foreground max-w-prose mx-auto">
          歡迎到店，由專業驗光師為你挑框、驗光、配鏡。建議事先線上預約，到店免等候。
        </p>
      </header>

      <div className="mx-auto max-w-3xl">
        <StoreInfoCard />
      </div>

      <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-card p-5">
          <h2 className="font-serif text-lg mb-2">交通與停車</h2>
          <p className="text-sm text-muted-foreground">
            位於桃園區中埔六街，鄰近市區道路；附近有路邊停車格。
          </p>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <h2 className="font-serif text-lg mb-2">建議先預約</h2>
          <p className="text-sm text-muted-foreground">
            處方配鏡需驗光時間，線上預約時段到店免等候。{" "}
            <Link
              href="/products?kind=prescription_frame"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              線上預約
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
