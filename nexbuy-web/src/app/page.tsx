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
import { HeroCarousel } from "@/components/site/HeroCarousel";
import { Reveal } from "@/components/site/Reveal";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationSchema, websiteSchema } from "@/lib/seo/schema";

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

const STEPS = [
  {
    n: "01",
    title: "線上挑款",
    desc: "在家慢慢看，鏡框、價格、適合的臉型一目了然。",
  },
  {
    n: "02",
    title: "預約或下單",
    desc: "成品款直接結帳寄出；處方鏡架選一個方便的到店時段。",
  },
  {
    n: "03",
    title: "到店配鏡 / 開箱",
    desc: "驗光師已備好、鏡架已在桌上；或者快遞到家直接戴上。",
  },
] as const;

// Placeholder photos sourced from Unsplash (whitelisted in next.config.ts).
// Swap to first-party photos once the shoot is done.
const HERO_SLIDES = [
  {
    src: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=1200&q=80&auto=format&fit=crop",
    alt: "鏡框示意 — 木紋桌面",
  },
  {
    src: "https://images.unsplash.com/photo-1577803645773-f96470509666?w=1200&q=80&auto=format&fit=crop",
    alt: "經典款式示意",
  },
  {
    src: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80&auto=format&fit=crop",
    alt: "鏡架特寫示意",
  },
] as const;
// 之前的 GALLERY 三張 stock photo 已替換為「我們怎麼陪你」資訊卡，
// 等實拍店內照齊全再 PR 切回圖片版。

export default function HomePage() {
  return (
    <div className="relative">
      <JsonLd data={organizationSchema()} />
      <JsonLd data={websiteSchema()} />
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
              <h1 className="font-heading text-5xl font-semibold leading-[0.98] tracking-[-0.02em] text-foreground md:text-7xl">
                在家挑框
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
            </div>

            <HeroCarousel slides={HERO_SLIDES} />
          </div>
        </div>
      </section>

      {/* ---------------- Brand story ---------------- */}
      <section id="story" className="relative mx-auto max-w-5xl px-4 py-20">
        <div className="grid gap-10 md:grid-cols-5 md:gap-14">
          <Reveal from="left" className="md:col-span-2">
            <div className="sticky top-24">
              <h2 className="font-heading text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
                我們相信，
                <br />
                眼鏡不只是工具，
                <br />
                <span className="text-primary">而是一張你願意每天戴上的臉。</span>
              </h2>
            </div>
          </Reveal>
          <Reveal
            from="right"
            delay={120}
            className="space-y-5 text-base leading-relaxed text-muted-foreground md:col-span-3 md:text-lg"
          >
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
          </Reveal>
        </div>
      </section>

      {/* ---------------- Values / services (dark reversal) ---------------- */}
      <section
        id="services"
        className="dark relative border-y border-border/60 bg-background text-foreground"
      >
        <div className="mx-auto max-w-5xl px-4 py-20">
          <Reveal from="left">
            <div className="mb-12 flex flex-col items-start gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                  我們提供什麼
                </h2>
              </div>
              <p className="max-w-md text-sm text-muted-foreground">
                三件事，做到底。從驗光、選框，到售後維護，每一步都不外包。
              </p>
            </div>
          </Reveal>
          <div className="grid gap-5 md:grid-cols-3">
            {VALUES.map(({ icon: Icon, title, desc }, i) => (
              <Reveal key={title} from="zoom-up" delay={i * 120}>
                <div className="group relative h-full overflow-hidden rounded-3xl border border-border/60 bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10">
                  <div
                    aria-hidden
                    className="absolute -top-16 -right-16 size-40 rounded-full bg-primary/15 blur-2xl transition-opacity group-hover:opacity-100 md:opacity-0"
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
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section id="how" className="mx-auto max-w-5xl px-4 py-20">
        <Reveal from="left">
          <div className="mb-10">
            <h2 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
              怎麼運作
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              三步驟，把線上跟到店接起來 — 你來的時候，東西早就準備好了。
            </p>
          </div>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} from="zoom-up" delay={i * 100}>
              <div className="relative h-full rounded-3xl border border-border/60 bg-card/60 p-6 backdrop-blur-sm">
                {/* 純裝飾的步驟序號（01/02/03）— 對視障使用者沒額外資訊
                 *（後面的標題已自帶順序），故 aria-hidden。axe-core 不再
                 * 把它當文字檢查 contrast。設計上保留低對比的視覺層次。 */}
                <div
                  aria-hidden
                  className="font-heading text-5xl font-semibold leading-none tracking-tight text-primary/30"
                >
                  {s.n}
                </div>
                <div className="mt-5 font-heading text-xl font-semibold">
                  {s.title}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {s.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- 服務內容 ---------------- */}
      {/*
       * 之前這區塊是「店裡的樣子」三張 stock photo（被 QA 抓到 cap / 蔬菜 /
       * 路人混進來），在真正拍店內照之前改成資訊卡更有業務價值。
       * admin 拍好真照後可以再回來換成圖片版。
       */}
      <section id="services" className="mx-auto max-w-5xl px-4 py-20">
        <Reveal from="left">
          <div className="mb-10">
            <h2 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
              我們怎麼陪你
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              一副眼鏡可以戴五年，所以前後每一步都用心做。
            </p>
          </div>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "完整驗光不趕時間",
              desc: "每位客人預留 30–45 分鐘。從度數、瞳距、瞳孔距離量到雙眼平衡，必要時加做色覺與立體感檢查。寧可慢一點不要錯。",
              tag: "驗光",
            },
            {
              title: "鏡架實戴試三次",
              desc: "選好框先戴 5 分鐘繞店內走一圈、看遠看近、找適合的鼻墊角度。覺得不對可以重來，沒人會在後面催你。",
              tag: "選框",
            },
            {
              title: "保固期內無條件調整",
              desc: "鏡腿鬆了、鼻墊歪了、鏡片刮了想再買同款 — 半年內回來都免費。我們希望你戴得安心。",
              tag: "售後",
            },
          ].map((card, i) => (
            <Reveal key={card.title} from="zoom-up" delay={i * 100}>
              <article className="group relative h-full overflow-hidden rounded-3xl border border-border/60 bg-card p-7 shadow-xl shadow-primary/5 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10">
                <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-primary">
                  {card.tag}
                </div>
                <h3 className="mt-3 font-heading text-xl font-semibold leading-snug">
                  {card.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {card.desc}
                </p>
              </article>
            </Reveal>
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

      {/* ---------------- Footer CTA ---------------- */}
      <section
        id="cta"
        className="relative isolate overflow-hidden border-t border-border/60"
      >
        <div
          aria-hidden
          className="animate-aurora pointer-events-none absolute -bottom-32 left-1/2 -z-10 size-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/30 via-chart-1/25 to-accent/30 blur-3xl"
        />
        <Reveal from="zoom-up" className="mx-auto max-w-3xl px-4 py-24 text-center">
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
        </Reveal>
      </section>
    </div>
  );
}
