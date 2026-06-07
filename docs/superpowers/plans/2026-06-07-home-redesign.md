# 首頁重設計（對齊 handoff 原型）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 prod 首頁從 #189 hybrid 版重做成 design handoff 原型的 7 區塊商品導向 landing，並保留門市 Map 在最下面。

**Architecture:** Server component 首頁，重用既有 `ProductCard` / `Reveal` / `getFeaturedProducts` / `getNewArrivals` / Google Map；改造 `HeroCarousel` 改吃真實商品；新增 `Marquee` 元件；`products.ts` helper 加向後相容的 `kind` 參數。設計系統 token / 字型 / Header / Footer 一律不動。

**Tech Stack:** Next.js 16 App Router、React 19、Tailwind 4、Base UI、lucide-react、Supabase。

**測試現實:** 本機 Node 20.9.0 < vitest4 需求 20.12，測試無法本機執行（見 MEMORY）。純邏輯 task 附 vitest 測試碼供 CI / Node 升級後跑；UI 驗證用 `pnpm typecheck`（worktree 缺 node_modules，於主 repo `C:/VisualDev/Nexbuy/nexbuy-web` 跑）+ `pnpm build` + Chrome 視覺 QA。

---

## File Structure

- **Modify** `nexbuy-web/src/lib/products.ts` — `getFeaturedProducts` / `getNewArrivals` 加 optional `kind` 參數。
- **Modify** `nexbuy-web/src/components/site/HeroCarousel.tsx` — props 從 `slides` 改 `products`，輪播商品圖+名+價、可點。
- **Create** `nexbuy-web/src/components/site/Marquee.tsx` — 水平跑馬燈，reduced-motion 靜止。
- **Modify** `nexbuy-web/src/app/page.tsx` — 整頁重寫成 8 區塊。
- **Create** `nexbuy-web/src/lib/products.test.ts` — kind 參數的純邏輯測試（CI/Node 升級後跑）。

---

### Task 1: products.ts — kind-aware helpers

**Files:**
- Modify: `nexbuy-web/src/lib/products.ts`
- Test: `nexbuy-web/src/lib/products.test.ts`

- [ ] **Step 1: 加 kind 參數（向後相容）**

`ProductKind` 已存在於 `@/lib/types/database`。改兩個 helper：

```ts
import { createServerSupabase } from "@/lib/supabase/server";
import type { ProductKind } from "@/lib/types/database";

export const PRODUCT_CARD_COLUMNS =
  "id, slug, name, price_cents, image_urls, kind, finished_stock, is_online_available";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  image_urls: string[];
  kind: ProductKind;
  finished_stock: number | null;
  is_online_available: boolean;
};

/** 本季新品：依 created_at 由新到舊。可選 kind 篩成品/處方。 */
export async function getNewArrivals(
  limit = 8,
  kind?: ProductKind,
): Promise<ProductCardData[]> {
  const sb = await createServerSupabase();
  let q = sb
    .from("products")
    .select(PRODUCT_CARD_COLUMNS)
    .eq("is_online_available", true);
  if (kind) q = q.eq("kind", kind);
  const { data, error } = await q
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("getNewArrivals failed:", error);
    return [];
  }
  return (data ?? []) as ProductCardData[];
}

/** 精選商品：is_featured = true。可選 kind。migration 未套用時回空陣列。 */
export async function getFeaturedProducts(
  limit = 8,
  kind?: ProductKind,
): Promise<ProductCardData[]> {
  const sb = await createServerSupabase();
  let q = sb
    .from("products")
    .select(PRODUCT_CARD_COLUMNS)
    .eq("is_online_available", true)
    .eq("is_featured", true);
  if (kind) q = q.eq("kind", kind);
  const { data, error } = await q
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.warn("getFeaturedProducts unavailable:", error.message);
    return [];
  }
  return (data ?? []) as ProductCardData[];
}
```

- [ ] **Step 2: typecheck**

Run（主 repo）: `cd C:/VisualDev/Nexbuy/nexbuy-web && pnpm typecheck 2>&1 | grep products`
Expected: 無 products.ts 相關錯誤。

- [ ] **Step 3: Commit**

```bash
git add nexbuy-web/src/lib/products.ts
git commit -m "feat(home): kind-aware getFeaturedProducts/getNewArrivals"
```

---

### Task 2: HeroCarousel — 改吃真實商品

**Files:**
- Modify: `nexbuy-web/src/components/site/HeroCarousel.tsx`

- [ ] **Step 1: 重寫元件吃 ProductCardData**

保留現有 index/paused/dots 輪播機制；slide 改成商品圖 + 底部疊「商品名 + 價格」可點連結。

```tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";
import type { ProductCardData } from "@/lib/products";

const ROTATE_MS = 5500;

export function HeroCarousel({ products }: { products: readonly ProductCardData[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (products.length <= 1 || paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % products.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [products.length, paused]);

  if (products.length === 0) return null;

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      role="region"
      aria-roledescription="輪播"
      aria-label="精選鏡框"
      className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border/60 shadow-2xl shadow-primary/15 ring-1 ring-foreground/5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {products.map((p, i) => (
        <Link
          key={p.id}
          href={`/products/${p.slug}`}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            i === index ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          aria-hidden={i !== index}
          tabIndex={i === index ? 0 : -1}
        >
          {p.image_urls[0] && (
            <Image
              src={p.image_urls[0]}
              alt={p.name}
              fill
              priority={i === 0}
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          )}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/65 via-black/15 to-transparent"
          />
          <div className="absolute inset-x-5 bottom-5 font-heading md:inset-x-7 md:bottom-7">
            <div className="text-xl font-medium leading-tight tracking-tight text-white md:text-2xl">
              {p.name}
            </div>
            <div className="mt-1 font-serif text-lg text-white/90">
              {formatPrice(p.price_cents)}
            </div>
          </div>
        </Link>
      ))}

      {products.length > 1 && (
        <div className="absolute right-5 top-5 flex gap-1.5 md:right-7 md:top-7">
          {products.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`第 ${i + 1} 張，共 ${products.length} 張`}
              aria-current={i === index}
              className={`h-1 rounded-full transition-all ${
                i === index ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/75"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

> `formatPrice` 來自 `@/lib/format`（既有，admin/cart 都用）。

- [ ] **Step 2: typecheck**（page.tsx 此時仍傳 slides 會報錯 → 預期，Task 4 修）

Run: `cd C:/VisualDev/Nexbuy/nexbuy-web && pnpm typecheck 2>&1 | grep HeroCarousel`
Expected: 僅 page.tsx:137 傳錯 props 的錯（Task 4 一起修）。元件本身無錯。

- [ ] **Step 3: Commit**

```bash
git add nexbuy-web/src/components/site/HeroCarousel.tsx
git commit -m "feat(home): HeroCarousel rotates real featured products"
```

---

### Task 3: Marquee 元件

**Files:**
- Create: `nexbuy-web/src/components/site/Marquee.tsx`

- [ ] **Step 1: 寫 Marquee（CSS 動畫 + reduced-motion 靜止）**

```tsx
const ITEMS = [
  "義式醋酸纖維",
  "日本鈦合金",
  "偏光抗 UV400",
  "台灣本地驗光",
  "七天鑑賞",
  "一年保固",
  "終身免費清洗調整",
];

export function Marquee() {
  // 內容重複兩份做無縫循環。整體裝飾性 → aria-hidden。
  const run = (
    <span className="flex shrink-0 items-center gap-6 px-3">
      {ITEMS.map((t) => (
        <span key={t} className="flex items-center gap-6 text-sm tracking-wide text-muted-foreground">
          {t}
          <span aria-hidden className="text-gold">◆</span>
        </span>
      ))}
    </span>
  );
  return (
    <div
      aria-hidden
      className="overflow-hidden border-y border-border/60 bg-bg-deep py-3"
    >
      <div className="flex w-max animate-marquee motion-reduce:animate-none">
        {run}
        {run}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 加 marquee keyframes 到 globals.css**

在 `nexbuy-web/src/app/globals.css` 末尾加：

```css
@keyframes marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
.animate-marquee {
  animation: marquee 28s linear infinite;
}
```

- [ ] **Step 3: typecheck + commit**

Run: `cd C:/VisualDev/Nexbuy/nexbuy-web && pnpm typecheck 2>&1 | grep -i marquee`
Expected: 無錯。

```bash
git add nexbuy-web/src/components/site/Marquee.tsx nexbuy-web/src/app/globals.css
git commit -m "feat(home): add Marquee strip component"
```

---

### Task 4: page.tsx — 重寫成 8 區塊

**Files:**
- Modify: `nexbuy-web/src/app/page.tsx`

一次重寫整頁（區塊互相依賴，單一 commit 最乾淨）。逐 step 建構，最後一起驗證。

- [ ] **Step 1: 改 imports + 資料抓取**

```tsx
import Link from "next/link";
import { Truck, ShieldCheck, Sparkles, Glasses, Camera, ArrowRight, MapPin, Clock } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { HeroCarousel } from "@/components/site/HeroCarousel";
import { Marquee } from "@/components/site/Marquee";
import { Reveal } from "@/components/site/Reveal";
import { ProductCard } from "@/components/site/ProductCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationSchema, websiteSchema } from "@/lib/seo/schema";
import { getFeaturedProducts, getNewArrivals } from "@/lib/products";
import { getWishlistProductIds } from "@/lib/wishlist";
import { createServerSupabase } from "@/lib/supabase/server";

const MAP_LABEL = encodeURIComponent("精鋐眼鏡行");
const MAP_EMBED_SRC = `https://maps.google.com/maps?q=25.0173074,121.2956103+(${MAP_LABEL})&hl=zh-TW&z=17&output=embed`;
const MAP_PUBLIC_URL = "https://maps.app.goo.gl/CBbpuKyNDXS7oPi38";

export default async function HomePage() {
  const [heroProducts, finished, rxArrivals, wishlistSet, sb] = await Promise.all([
    getFeaturedProducts(6),
    getFeaturedProducts(8, "finished"),
    getNewArrivals(8, "prescription_frame"),
    getWishlistProductIds(),
    createServerSupabase(),
  ]);
  // 成品 grid：featured finished 不足 4 件時補最新 finished
  const finishedGrid = finished.length >= 4
    ? finished
    : await getNewArrivals(8, "finished");
  const { data: { user } } = await sb.auth.getUser();
  const isLoggedIn = !!user;
  // hero 無 featured 時 fallback 最新
  const heroSlides = heroProducts.length > 0 ? heroProducts : await getNewArrivals(6);
```

- [ ] **Step 2: 區塊 1 Hero（看世界慢一拍 + 三欄價值 + carousel）**

```tsx
  return (
    <div className="relative">
      <JsonLd data={organizationSchema()} />
      <JsonLd data={websiteSchema()} />

      {/* 1. Hero */}
      <section className="relative isolate overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-secondary/60 via-background to-accent/30" />
        <div className="mx-auto max-w-5xl px-4 py-16">
          <div className="grid gap-8 py-12 md:grid-cols-2 md:items-center md:gap-12 md:py-20">
            <div className="space-y-5">
              <p className="eyebrow">ARTISAN · EYEWEAR · 2026</p>
              <h1 className="font-serif text-4xl font-medium leading-[1.05] tracking-tight text-foreground md:text-6xl">
                看世界，<br />用<em className="text-primary not-italic">慢一拍</em>的眼光。
              </h1>
              <p className="text-lg leading-relaxed text-muted-foreground">
                我們挑選義大利醋酸纖維與日本鈦合金，與台灣的驗光師合作。每一副都希望能跟你十年。
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link href="/products" className={buttonVariants({ size: "lg" })}>選購鏡框</Link>
                <Link href="/quiz" className={buttonVariants({ size: "lg", variant: "outline" })}>先做個臉型測驗</Link>
              </div>
              <div className="flex flex-wrap gap-6 pt-6">
                {[["滿 3,000","免運費"],["處方鏡框","線上預約・店內驗光"],["原廠保固","一年"]].map(([k,v],i)=>(
                  <div key={k} className="flex items-center gap-6">
                    {i>0 && <div aria-hidden className="h-8 w-px bg-border" />}
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
```

- [ ] **Step 3: 區塊 3 成品太陽眼鏡 grid**

```tsx
      {/* 3. 成品太陽眼鏡 */}
      {finishedGrid.length > 0 && (
        <section className="container py-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-2">本季精選 · SS 2026</p>
              <h2 className="font-serif text-2xl font-medium md:text-3xl">成品<em className="text-primary not-italic">太陽眼鏡</em></h2>
            </div>
            <Link href="/products?kind=finished" className="inline-flex items-center gap-1 text-sm text-primary hover:underline underline-offset-2">看全部 <ArrowRight className="size-3.5" /></Link>
          </div>
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 nav:grid-cols-4">
            {finishedGrid.map((p, i) => (
              <li key={p.id}>
                <ProductCard product={p} inWishlist={wishlistSet.has(p.id)} isLoggedIn={isLoggedIn} priority={i < 4} />
              </li>
            ))}
          </ul>
        </section>
      )}
```

- [ ] **Step 4: 區塊 4 試戴 editorial split**

```tsx
      {/* 4. 試戴 editorial */}
      <section className="container py-16">
        <div className="grid items-center gap-8 rounded-3xl border border-border/60 bg-card p-8 md:grid-cols-2 md:p-12">
          <Reveal from="left" className="space-y-4">
            <p className="eyebrow">虛擬試戴 · BETA</p>
            <h3 className="font-serif text-2xl font-medium leading-snug md:text-3xl">上傳一張照片，<br />每副鏡框的樣子都先看過。</h3>
            <p className="leading-relaxed text-muted-foreground">選一張正面照，把精鋐任何一副鏡框疊在你臉上預覽。位置、大小、角度都可以微調，照片只在你的瀏覽器中處理，不上傳。</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/tryon" className={buttonVariants()}><Camera className="mr-1 size-4" />開始試戴</Link>
              <Link href="/quiz" className={buttonVariants({ variant: "outline" })}>先做臉型測驗</Link>
            </div>
          </Reveal>
          <Reveal from="right" delay={120} className="flex justify-center">
            <div className="relative aspect-square w-full max-w-sm rounded-2xl bg-bg-deep">
              <div aria-hidden className="absolute left-1/2 top-1/2 size-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-muted-foreground/40" />
              <Glasses aria-hidden className="absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <p className="eyebrow absolute inset-x-0 bottom-5 text-center">UPLOAD · OVERLAY · PREVIEW</p>
            </div>
          </Reveal>
        </div>
      </section>
```

- [ ] **Step 5: 區塊 5 處方 CTA banner + 4 步驟**

```tsx
      {/* 5. 處方 CTA banner */}
      <section className="dark border-y border-border/60 bg-bg-deep text-foreground">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 py-20 md:grid-cols-2 md:items-center">
          <div className="space-y-4">
            <p className="eyebrow text-gold">處方鏡框 · 預約到店配鏡</p>
            <h2 className="font-serif text-3xl font-medium leading-snug md:text-4xl">線上挑款，<em className="text-primary not-italic">到店驗光</em>。<br />不必空等也不必跑兩趟。</h2>
            <p className="leading-relaxed text-muted-foreground">線上選好處方鏡框款式，預約 30 分鐘時段到精鋐眼鏡行。驗光師現場量測、討論鏡片選擇，配鏡後免費寄送到家。</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/products?kind=prescription_frame" className={buttonVariants()}>看處方鏡框</Link>
              <Link href="/store" className={buttonVariants({ variant: "outline" })}>查看門市資訊</Link>
            </div>
          </div>
          <ol className="space-y-5 rounded-3xl border border-border/60 bg-card/40 p-8">
            {[["01","線上挑選處方鏡框款式"],["02","選擇 30 分鐘到店預約時段"],["03","店內驗光・討論鏡片"],["04","配鏡完成・免費宅配"]].map(([n,t])=>(
              <li key={n} className="flex items-baseline gap-4">
                <span className="font-serif text-2xl italic text-gold">{n}</span>
                <span className="text-base">{t}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
```

- [ ] **Step 6: 區塊 6 新進框型 grid**

```tsx
      {/* 6. 本季新進框型 */}
      {rxArrivals.length > 0 && (
        <section className="container py-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-2">處方鏡框 · 預約配鏡</p>
              <h2 className="font-serif text-2xl font-medium md:text-3xl">本季<em className="text-primary not-italic">新進框型</em></h2>
            </div>
            <Link href="/products?kind=prescription_frame" className="inline-flex items-center gap-1 text-sm text-primary hover:underline underline-offset-2">看全部 <ArrowRight className="size-3.5" /></Link>
          </div>
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 nav:grid-cols-4">
            {rxArrivals.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} inWishlist={wishlistSet.has(p.id)} isLoggedIn={isLoggedIn} priority={false} />
              </li>
            ))}
          </ul>
        </section>
      )}
```

- [ ] **Step 7: 區塊 7 底部 4 價值**

```tsx
      {/* 7. 底部價值 */}
      <section className="container border-t border-border/60 py-16">
        <div className="grid gap-8 sm:grid-cols-2 nav:grid-cols-4">
          {[
            [Truck, "滿 NT$ 3,000 免運", "本島宅配 / 7-11 交貨便皆可"],
            [ShieldCheck, "一年原廠保固", "非人為瑕疵免費維修或換新"],
            [Sparkles, "終身免費清洗調整", "門市提供超音波清洗"],
            [Glasses, "七天無條件鑑賞", "鏡片未配製的成品太陽眼鏡"],
          ].map(([Icon, t, d]) => {
            const I = Icon as React.ComponentType<{ className?: string }>;
            return (
              <div key={t as string} className="flex items-start gap-4">
                <I className="mt-1 size-6 shrink-0 text-primary" />
                <div>
                  <div className="font-serif text-base font-medium">{t as string}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{d as string}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
```

- [ ] **Step 8: 區塊 8 門市 Map（保留，移到最下）+ 收尾**

從舊 page.tsx 把「來坐一下」整段 `<section id="visit">…</section>`（含 Google Map iframe + 兩張門市卡）原樣搬到這裡作為最後一個區塊。結尾 `</div>`。

> 完整 Map 區塊 JSX 見舊 `page.tsx:405-499`（git show HEAD~ 可取）。原樣保留、不改內容。

```tsx
      {/* 8. 門市 Map（保留） */}
      {/* …從舊 page.tsx id="visit" section 原樣搬入… */}
    </div>
  );
}
```

- [ ] **Step 9: 驗證 + commit**

Run: `cd C:/VisualDev/Nexbuy/nexbuy-web && pnpm typecheck 2>&1 | grep "app/page"`
Expected: 無 page.tsx 錯誤。

```bash
git add nexbuy-web/src/app/page.tsx
git commit -m "feat(home): rebuild home as 7-block prototype landing + store map"
```

---

### Task 5: 驗證 — build + 視覺 QA + 效能

**Files:** 無（驗證 only）

- [ ] **Step 1: 全專案 typecheck**

Run: `cd C:/VisualDev/Nexbuy/nexbuy-web && pnpm typecheck 2>&1 | grep -vE "mediapipe|next-themes|recharts|nodemailer|upstash"`
Expected: 無新錯（既有第三方 type 缺漏不算）。

- [ ] **Step 2: build**

Run: `cd C:/VisualDev/Nexbuy/nexbuy-web && pnpm build`
Expected: build 成功。

- [ ] **Step 3: 視覺 QA（Chrome 已連）**

啟動 dev server，用 Chrome 截圖比對原型截圖：8 區塊順序、hero carousel 商品可點、marquee 跑動、成品/處方 grid 分流正確、深淺主題下處方 banner 對比、Map 在最下。reduced-motion 下 marquee 靜止。

- [ ] **Step 4: 效能量測**

Warm 連 hit 5 次取 median，確認首頁 TTFB < 300ms / total < 500ms（`docs/scaling.md`）。超標在 PR 標出取捨。

- [ ] **Step 5: 兩段式 PR**

`feat/home-redesign → dev`（PR），merge 後 `dev → main`（PR）。

---

## Self-Review

**Spec coverage：**
- 8 區塊結構 → Task 4 Step 2-8 ✓
- 移除舊區塊（我們相信/提供什麼/怎麼陪你/Footer CTA/試戴2卡）→ Task 4 整頁重寫即不含這些 ✓
- 門市 Map 保留最下 → Task 4 Step 8 ✓
- HeroCarousel 改商品 → Task 2 ✓
- Marquee 新增 → Task 3 ✓
- helper kind 參數 → Task 1 ✓
- featured fallback 最新 → Task 4 Step 1（finishedGrid / heroSlides fallback）✓
- 效能量測 → Task 5 Step 4 ✓

**Placeholder scan：** Task 4 Step 8 引用舊 page.tsx Map 區塊「原樣搬入」而非貼整段 —— 因為是「原封不動複製既有 JSX」，給了精確行號（`page.tsx:405-499`）+ git 取法，非 placeholder。其餘步驟皆含完整 code。

**Type consistency：** `ProductCardData` (Task 1) 用於 HeroCarousel props (Task 2) 與 page (Task 4) 一致；`getFeaturedProducts(limit, kind?)` / `getNewArrivals(limit, kind?)` 簽名 Task 1 定義、Task 4 呼叫一致；`Marquee` 無 props，Task 4 直接 `<Marquee />` 一致。
