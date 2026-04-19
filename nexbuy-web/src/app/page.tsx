import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <section className="grid gap-6 py-12 md:grid-cols-2 md:items-center md:gap-12 md:py-20">
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            在家挑框、到店配鏡
          </h1>
          <p className="text-lg text-muted-foreground">
            成品眼鏡線上直接購買;處方鏡架線上預約到店驗光配鏡。
            門市為你準備好,你只要走進來。
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/products?kind=finished"
              className={buttonVariants({ size: "lg" })}
            >
              逛成品眼鏡
            </Link>
            <Link
              href="/products?kind=prescription_frame"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              預約配處方鏡片
            </Link>
          </div>
        </div>
        <div
          className="aspect-[4/3] rounded-lg border bg-muted/50"
          aria-hidden
        />
      </section>
    </div>
  );
}
