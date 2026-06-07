import type { ComponentType } from "react";
import Link from "next/link";
import {
  Glasses,
  ShieldCheck,
  Truck,
  MapPin,
  Clock,
  ArrowRight,
  Camera,
  Sparkles,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { HeroCarousel } from "@/components/site/HeroCarousel";
import { Marquee } from "@/components/site/Marquee";
import { Reveal } from "@/components/site/Reveal";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationSchema, websiteSchema } from "@/lib/seo/schema";
import { getFeaturedProducts, getNewArrivals } from "@/lib/products";
import { ProductCard } from "@/components/site/ProductCard";
import { getWishlistProductIds } from "@/lib/wishlist";
import { createServerSupabase } from "@/lib/supabase/server";

const MAP_LABEL = encodeURIComponent("精鋐眼鏡行");
const MAP_EMBED_SRC = `https://maps.google.com/maps?q=25.0173074,121.2956103+(${MAP_LABEL})&hl=zh-TW&z=17&output=embed`;
const MAP_PUBLIC_URL = "https://maps.app.goo.gl/CBbpuKyNDXS7oPi38";

export default async function HomePage() {
  const [heroFeatured, finishedFeatured, rxArrivals, wishlistSet, sb] =
    await Promise.all([
      getFeaturedProducts(6),
      getFeaturedProducts(8, "finished"),
      getNewArrivals(8, "prescription_frame"),
      getWishlistProductIds(),
      createServerSupabase(),
    ]);
  const finishedGrid =
    finishedFeatured.length >= 4
      ? finishedFeatured
      : await getNewArrivals(8, "finished");
  const heroSlides =
    heroFeatured.length > 0 ? heroFeatured : await getNewArrivals(6);
  const {
    data: { user },
  } = await sb.auth.getUser();
  const isLoggedIn = !!user;

  return (
    <div className="relative">
      <JsonLd data={organizationSchema()} />
      <JsonLd data={websiteSchema()} />

      {/* 1. Hero */}
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-secondary/60 via-background to-accent/30"
        />
        <div className="mx-auto max-w-5xl px-4 py-16">
          <div className="grid gap-8 py-12 md:grid-cols-2 md:items-center md:gap-12 md:py-20">
            <div className="space-y-5">
              <p className="eyebrow">ARTISAN · EYEWEAR · 2026</p>
              <h1 className="font-serif text-4xl font-medium leading-[1.05] tracking-tight text-foreground md:text-6xl">
                看世界，
                <br />用<em className="not-italic text-primary">慢一拍</em>的眼光。
              </h1>
              <p className="text-lg leading-relaxed text-muted-foreground">
                我們挑選義大利醋酸纖維與日本鈦合金，與台灣的驗光師合作。每一副都希望能跟你十年。
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link href="/products" className={buttonVariants({ size: "lg" })}>
                  選購鏡框
                </Link>
                <Link
                  href="/quiz"
                  className={buttonVariants({ size: "lg", variant: "outline" })}
                >
                  先做個臉型測驗
                </Link>
              </div>
              <div className="flex flex-wrap gap-6 pt-6">
                {[
                  ["滿 3,000", "免運費"],
                  ["處方鏡框", "線上預約・店內驗光"],
                  ["原廠保固", "一年"],
                ].map(([k, v], i) => (
                  <div key={k} className="flex items-center gap-6">
                    {i > 0 && <div aria-hidden className="h-8 w-px bg-border" />}
                    <div>
                      <div className="eyebrow">{k}</div>
                      <div className="mt-1 font-serif text-xl">{v}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <HeroCarousel products={heroSlides} />
          </div>
        </div>
      </section>

      {/* 2. Marquee */}
      <Marquee />

      {/* 3. 成品太陽眼鏡 */}
      {finishedGrid.length > 0 && (
        <section className="container py-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-2">本季精選 · SS 2026</p>
              <h2 className="font-serif text-2xl font-medium md:text-3xl">
                成品<em className="not-italic text-primary">太陽眼鏡</em>
              </h2>
            </div>
            <Link
              href="/products?kind=finished"
              className="inline-flex items-center gap-1 text-sm text-primary underline-offset-2 hover:underline"
            >
              看全部 <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 nav:grid-cols-4">
            {finishedGrid.map((p, i) => (
              <li key={p.id}>
                <ProductCard
                  product={p}
                  inWishlist={wishlistSet.has(p.id)}
                  isLoggedIn={isLoggedIn}
                  priority={i < 4}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 4. 試戴 editorial */}
      <section className="container py-16">
        <div className="grid items-center gap-8 rounded-3xl border border-border/60 bg-card p-8 md:grid-cols-2 md:p-12">
          <Reveal from="left" className="space-y-4">
            <p className="eyebrow">虛擬試戴 · BETA</p>
            <h3 className="font-serif text-2xl font-medium leading-snug md:text-3xl">
              上傳一張照片，
              <br />
              每副鏡框的樣子都先看過。
            </h3>
            <p className="leading-relaxed text-muted-foreground">
              選一張正面照，把精鋐任何一副鏡框疊在你臉上預覽。位置、大小、角度都可以微調，照片只在你的瀏覽器中處理，不上傳。
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/tryon" className={buttonVariants()}>
                <Camera className="mr-1 size-4" />
                開始試戴
              </Link>
              <Link href="/quiz" className={buttonVariants({ variant: "outline" })}>
                先做臉型測驗
              </Link>
            </div>
          </Reveal>
          <Reveal from="right" delay={120} className="flex justify-center">
            <div className="relative aspect-square w-full max-w-sm rounded-2xl bg-bg-deep">
              <div
                aria-hidden
                className="absolute left-1/2 top-1/2 size-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-muted-foreground/40"
              />
              <Glasses
                aria-hidden
                className="absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 text-muted-foreground/50"
              />
              <p className="eyebrow absolute inset-x-0 bottom-5 text-center">
                UPLOAD · OVERLAY · PREVIEW
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 5. 處方 CTA banner */}
      <section className="dark border-y border-border/60 bg-bg-deep text-foreground">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 py-20 md:grid-cols-2 md:items-center">
          <div className="space-y-4">
            <p className="eyebrow text-gold">處方鏡框 · 預約到店配鏡</p>
            <h2 className="font-serif text-3xl font-medium leading-snug md:text-4xl">
              線上挑款，<em className="not-italic text-primary">到店驗光</em>。
              <br />
              不必空等也不必跑兩趟。
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              線上選好處方鏡框款式，預約 30 分鐘時段到精鋐眼鏡行。驗光師現場量測、討論鏡片選擇，配鏡後免費寄送到家。
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/products?kind=prescription_frame"
                className={buttonVariants()}
              >
                看處方鏡框
              </Link>
              <Link href="/store" className={buttonVariants({ variant: "outline" })}>
                查看門市資訊
              </Link>
            </div>
          </div>
          <ol className="space-y-5 rounded-3xl border border-border/60 bg-card/40 p-8">
            {[
              ["01", "線上挑選處方鏡框款式"],
              ["02", "選擇 30 分鐘到店預約時段"],
              ["03", "店內驗光・討論鏡片"],
              ["04", "配鏡完成・免費宅配"],
            ].map(([n, t]) => (
              <li key={n} className="flex items-baseline gap-4">
                <span className="font-serif text-2xl italic text-gold">{n}</span>
                <span className="text-base">{t}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 6. 本季新進框型 */}
      {rxArrivals.length > 0 && (
        <section className="container py-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-2">處方鏡框 · 預約配鏡</p>
              <h2 className="font-serif text-2xl font-medium md:text-3xl">
                本季<em className="not-italic text-primary">新進框型</em>
              </h2>
            </div>
            <Link
              href="/products?kind=prescription_frame"
              className="inline-flex items-center gap-1 text-sm text-primary underline-offset-2 hover:underline"
            >
              看全部 <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 nav:grid-cols-4">
            {rxArrivals.map((p) => (
              <li key={p.id}>
                <ProductCard
                  product={p}
                  inWishlist={wishlistSet.has(p.id)}
                  isLoggedIn={isLoggedIn}
                  priority={false}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 7. 底部價值 */}
      <section className="container border-t border-border/60 py-16">
        <div className="grid gap-8 sm:grid-cols-2 nav:grid-cols-4">
          {(
            [
              [Truck, "滿 NT$ 3,000 免運", "本島宅配 / 7-11 交貨便皆可"],
              [ShieldCheck, "一年原廠保固", "非人為瑕疵免費維修或換新"],
              [Sparkles, "終身免費清洗調整", "門市提供超音波清洗"],
              [Glasses, "七天無條件鑑賞", "鏡片未配製的成品太陽眼鏡"],
            ] as const
          ).map(([Icon, t, d]) => {
            const I = Icon as ComponentType<{ className?: string }>;
            return (
              <div key={t} className="flex items-start gap-4">
                <I className="mt-1 size-6 shrink-0 text-primary" />
                <div>
                  <div className="font-serif text-base font-medium">{t}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{d}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. Map / visit us */}
      <section id="visit" className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-12 -z-10 mx-auto h-32 max-w-3xl rounded-full bg-primary/15 blur-3xl"
        />
        <div className="mx-auto max-w-5xl px-4 py-20">
          <Reveal from="left">
            <div className="mb-10 flex flex-col items-start gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
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
          </Reveal>

          <div className="grid gap-5 lg:grid-cols-5 lg:items-stretch">
            <Reveal
              from="zoom"
              className="overflow-hidden rounded-3xl border border-border/60 shadow-xl shadow-primary/5 lg:col-span-3"
            >
              <iframe
                src={MAP_EMBED_SRC}
                title="精鋐眼鏡行 Google Map"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[420px] w-full border-0 grayscale-[15%] transition-[filter] hover:grayscale-0"
                allowFullScreen
              />
            </Reveal>
            <div className="flex flex-col gap-4 lg:col-span-2">
              <Reveal from="right" delay={120} className="flex flex-1">
                <div className="flex flex-1 items-center rounded-3xl border border-border/60 bg-card/60 p-6 backdrop-blur-sm">
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
              </Reveal>
              <Reveal from="right" delay={240} className="flex flex-1">
                <div className="flex flex-1 items-center rounded-3xl border border-border/60 bg-card/60 p-6 backdrop-blur-sm">
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
                        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary underline underline-offset-2 decoration-primary/40 hover:decoration-primary"
                      >
                        看可預約的鏡架
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
