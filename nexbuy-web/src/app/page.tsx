import Link from "next/link";
import {
  Eye,
  Glasses,
  ShieldCheck,
  MapPin,
  Clock,
  ArrowRight,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const MAP_LABEL = encodeURIComponent("精鋐眼鏡行");
const MAP_EMBED_SRC = `https://maps.google.com/maps?q=25.0173074,121.2956103+(${MAP_LABEL})&hl=zh-TW&z=17&output=embed`;
const MAP_PUBLIC_URL = "https://maps.app.goo.gl/CBbpuKyNDXS7oPi38";

const VALUES = [
  {
    icon: Eye,
    title: "專業驗光",
    desc: "資深驗光師細緻把關，從度數到瞳距、從眼壓到生活習慣全都納入考量。",
  },
  {
    icon: Glasses,
    title: "精選鏡框",
    desc: "每一副鏡框都親自挑選，經典與當代並陳，戴起來舒服、看起來剛剛好。",
  },
  {
    icon: ShieldCheck,
    title: "售後保固",
    desc: "鏡架調整、清洗、小修永遠免費；買的不只是一副眼鏡，是一段服務。",
  },
] as const;

const HIGHLIGHTS = [
  { kpi: "線上選 + 到店配", desc: "在家挑款式，到店再驗光" },
  { kpi: "成品宅配到府", desc: "平光款下單後直接寄出" },
  { kpi: "預約優先服務", desc: "免排隊、鏡架已備妥" },
] as const;

export default function HomePage() {
  return (
    <div className="relative">
      {/* ---------------- Hero ---------------- */}
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-secondary/60 via-background to-accent/30"
        />
        <div
          aria-hidden
          className="animate-aurora pointer-events-none absolute -top-32 -right-24 -z-10 size-[32rem] rounded-full bg-gradient-to-br from-accent/45 via-chart-1/30 to-primary/20 blur-3xl"
        />
        <div
          aria-hidden
          className="animate-aurora-slow pointer-events-none absolute -bottom-40 -left-32 -z-10 size-[36rem] rounded-full bg-gradient-to-br from-primary/20 via-chart-2/25 to-accent/35 blur-3xl"
        />

        <div className="mx-auto max-w-5xl px-4 py-16">
          <div className="grid gap-8 py-12 md:grid-cols-2 md:items-center md:gap-12 md:py-20">
            <div className="space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                <span className="size-1.5 rounded-full bg-chart-1" />
                JING HONG OPTICAL · 在地眼鏡行
              </span>
              <h1 className="font-heading text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-6xl">
                在家挑框、
                <br />
                <span className="text-sheen">到店配鏡</span>
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
                href="#story"
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
          </div>
        </div>
      </section>

      {/* ---------------- Brand story ---------------- */}
      <section id="story" className="relative mx-auto max-w-5xl px-4 py-20">
        <div className="grid gap-10 md:grid-cols-5 md:gap-14">
          <div className="md:col-span-2">
            <div className="sticky top-24 space-y-6">
              <span className="inline-block rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
                ABOUT
              </span>
              <h2 className="font-heading text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
                我們相信，
                <br />
                眼鏡不只是工具，
                <br />
                <span className="text-primary">而是一張你願意每天戴上的臉。</span>
              </h2>
            </div>
          </div>
          <div className="space-y-5 text-base leading-relaxed text-muted-foreground md:col-span-3 md:text-lg">
            <p>
              精鋐眼鏡行做的事很簡單 — 把鏡框、鏡片、和你的臉，配得剛剛好。
            </p>
            <p>
              我們不追每一波潮流，但會把每一副經典款式守好；
              我們不堆滿牆面的展示款，但每一副鏡框都親自挑過，
              戴起來能撐住一整天的舒服。
            </p>
            <p>
              線上下單買成品眼鏡，平光、太陽眼鏡直接寄到家；
              處方鏡架線上預約時段，到店有人接、有鏡架已備好、有驗光師慢慢談。
              這就是我們想要的：把「挑眼鏡」這件事，變成一段不趕時間的小旅行。
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- Values / services ---------------- */}
      <section
        id="services"
        className="relative border-y border-border/60 bg-card/40 backdrop-blur-sm"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-accent/10 to-transparent"
        />
        <div className="mx-auto max-w-5xl px-4 py-20">
          <div className="mb-12 flex flex-col items-start gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-block rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground">
                SERVICES
              </span>
              <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight md:text-4xl">
                我們提供什麼
              </h2>
            </div>
            <p className="max-w-md text-sm text-muted-foreground">
              三件事，做到底。從驗光、選框，到售後維護，每一步都不外包。
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group relative overflow-hidden rounded-3xl border border-border/60 bg-background/60 p-6 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-chart-1/50 hover:shadow-xl hover:shadow-primary/5"
              >
                <div
                  aria-hidden
                  className="absolute -top-16 -right-16 size-40 rounded-full bg-chart-1/15 blur-2xl transition-opacity group-hover:opacity-100 md:opacity-0"
                />
                <div className="relative">
                  <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
                    <Icon className="size-6" />
                  </div>
                  <div className="mt-5 font-heading text-xl font-semibold">
                    {title}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Highlights ---------------- */}
      <section id="highlights" className="mx-auto max-w-5xl px-4 py-20">
        <div className="grid gap-3 sm:grid-cols-3">
          {HIGHLIGHTS.map((h) => (
            <div
              key={h.kpi}
              className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-sm"
            >
              <div className="font-heading text-2xl font-semibold leading-tight text-primary">
                {h.kpi}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">{h.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Map / visit us ---------------- */}
      <section id="visit" className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-12 -z-10 mx-auto h-32 max-w-3xl rounded-full bg-primary/15 blur-3xl"
        />
        <div className="mx-auto max-w-5xl px-4 py-20">
          <div className="mb-10 flex flex-col items-start gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-block rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
                VISIT
              </span>
              <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight md:text-4xl">
                來坐一下
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                配鏡是慢工，預約讓我們把時間留給你。
              </p>
            </div>
            <Link
              href={MAP_PUBLIC_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline" })}
            >
              <MapPin className="mr-1 size-4" />
              在 Google 地圖開啟
            </Link>
          </div>

          <div className="grid gap-5 lg:grid-cols-5">
            <div className="overflow-hidden rounded-3xl border border-border/60 shadow-xl shadow-primary/5 lg:col-span-3">
              <iframe
                src={MAP_EMBED_SRC}
                title="精鋐眼鏡行 Google Map"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[420px] w-full border-0 grayscale-[15%] transition-[filter] hover:grayscale-0"
                allowFullScreen
              />
            </div>
            <div className="flex flex-col gap-4 lg:col-span-2">
              <div className="rounded-3xl border border-border/60 bg-card/60 p-6 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 inline-flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
                    <MapPin className="size-4" />
                  </div>
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      門市
                    </div>
                    <div className="mt-1 font-heading text-lg font-semibold">
                      精鋐眼鏡行
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      地址、電話與營業時間請點右上角「在 Google 地圖開啟」查看最新資訊。
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-border/60 bg-card/60 p-6 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 inline-flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
                    <Clock className="size-4" />
                  </div>
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      預約優先
                    </div>
                    <div className="mt-1 font-heading text-lg font-semibold">
                      線上選好，到店剛好
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      喜歡的鏡架先在線上預約時段，到店時鏡架已備妥、驗光師也準備好。
                    </p>
                    <Link
                      href="/products?kind=prescription_frame"
                      className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      看可預約的鏡架
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Footer CTA ---------------- */}
      <section
        id="cta"
        className="relative isolate overflow-hidden border-t border-border/60"
      >
        <div
          aria-hidden
          className="animate-aurora pointer-events-none absolute -bottom-32 left-1/2 -z-10 size-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/30 via-chart-1/25 to-accent/30 blur-3xl"
        />
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <h2 className="font-heading text-3xl font-semibold leading-tight md:text-5xl">
            <span className="text-sheen">下一副眼鏡</span>
            ，
            <br className="sm:hidden" />
            就從這裡開始。
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            線上挑款，到店配鏡。
            或者，直接買一副已經為你備好的成品眼鏡。
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/products?kind=prescription_frame"
              className={buttonVariants({ size: "lg" })}
            >
              預約到店配鏡
              <ArrowRight className="ml-1 size-4" />
            </Link>
            <Link
              href="/products?kind=finished"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              逛成品眼鏡
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
