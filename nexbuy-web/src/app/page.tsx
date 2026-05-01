import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-secondary/60 via-background to-accent/30"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-32 -right-24 -z-10 size-[28rem] rounded-full bg-accent/40 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-40 -left-32 -z-10 size-[32rem] rounded-full bg-primary/15 blur-3xl"
        aria-hidden
      />

      <div className="mx-auto max-w-5xl px-4 py-16">
        <section className="grid gap-8 py-12 md:grid-cols-2 md:items-center md:gap-12 md:py-20">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="size-1.5 rounded-full bg-chart-1" />
              眼鏡線上通路 · MVP
            </span>
            <h1 className="font-heading text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-6xl">
              在家挑框、
              <br />
              <span className="text-primary">到店配鏡</span>
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground md:text-xl">
              成品眼鏡線上直接購買；處方鏡架線上預約到店驗光配鏡。
              門市為你準備好，你只要走進來。
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
            <Link
              href="/about"
              className="inline-flex items-center gap-1 pt-1 text-sm font-medium text-primary hover:underline"
            >
              認識精鋐眼鏡行 →
            </Link>
          </div>

          <div className="relative">
            <div
              className="aspect-[4/3] overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/20 via-accent/40 to-secondary shadow-xl shadow-primary/5"
              aria-hidden
            >
              <div className="relative size-full">
                <div className="absolute left-1/2 top-1/2 size-2/3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-card/70 to-transparent blur-2xl" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center font-heading text-5xl font-semibold leading-tight text-primary/35 md:text-7xl">
                  精鋐
                  <br />
                  眼鏡行
                </div>
              </div>
            </div>
            <div
              className="absolute -bottom-4 -right-4 size-24 rounded-2xl bg-chart-1/80 shadow-lg shadow-chart-1/20 md:size-32"
              aria-hidden
            />
            <div
              className="absolute -top-4 -left-4 size-16 rounded-2xl border border-border/80 bg-card md:size-20"
              aria-hidden
            />
          </div>
        </section>

        <section className="grid gap-4 pb-8 sm:grid-cols-3">
          {[
            { title: "8 款精選鏡框", desc: "從太陽眼鏡到平光、處方鏡架" },
            { title: "到店驗光配鏡", desc: "處方款式線上預約、門市配製" },
            { title: "宅配 / 自取", desc: "成品眼鏡直接寄到家" },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-sm transition-colors hover:border-chart-1/40 hover:bg-card"
            >
              <div className="font-heading text-lg font-semibold text-foreground">
                {feature.title}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {feature.desc}
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
