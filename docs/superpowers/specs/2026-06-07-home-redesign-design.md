# 首頁重設計 — 對齊 design handoff 原型

- 日期：2026-06-07
- 分支：從最新 `origin/dev` 開 `feat/home-redesign`
- 範圍：把 prod 首頁（`nexbuy-web/src/app/page.tsx`）重做成 design handoff 原型
  （`design_handoff_nexbuy_storefront/src/customer-pages.jsx` 的 `HomePage`）的
  純品牌展示 + 商品導向編排。

## 背景

prod 首頁目前是 #189「hybrid home」：hero + 精選商品 + 一連串敘事長文區塊
（我們相信 / 我們提供什麼 / 怎麼運作 / 我們怎麼陪你）+ 本季新品 + 試戴導引 +
門市 Map + Footer CTA。設計**系統**（暖奶油/赤陶/serif/eyebrow/Cormorant
字型、雙主題 token）已完整套用且正確，但首頁**內容編排**跟原型那張純展示
landing 差異明顯。本次把首頁編排拉回原型。

設計系統層不動（token、字型、Header、Footer、其他頁面都維持）。只動首頁。

## 目標區塊結構（原型 7 區塊 + 保留 Map）

| # | 區塊 | 資料 / 來源 | 重用 prod | 新增 |
|---|---|---|---|---|
| 1 | **Hero** | 文案 hardcode；carousel 取 `getFeaturedProducts` | eyebrow/serif token、buttonVariants | 三欄價值列、HeroCarousel 改吃商品 |
| 2 | **跑馬燈 Marquee** | hardcode 文字 | — | `Marquee` 元件 + CSS 動畫 |
| 3 | **成品太陽眼鏡 grid** | finished kind（featured 優先、fallback 最新） | `ProductCard`、grid pattern | helper 加 `kind` 參數 |
| 4 | **試戴 editorial split** | hardcode | `Reveal`、Camera icon、buttonVariants | 左文右視覺 editorial 版型 |
| 5 | **處方 CTA banner + 4 步驟** | hardcode 步驟 | buttonVariants | 深色 banner 版型 + 4 步驟流程卡 |
| 6 | **本季新進框型 grid** | prescription_frame kind（最新） | `ProductCard`、grid pattern | helper 加 `kind` 參數 |
| 7 | **底部 4 價值** | hardcode | lucide icons、eyebrow | 4 欄 icon 價值列 |
| 8 | **門市 Map（保留）** | 現有 Map embed + 門市卡 | 整段「來坐一下」原樣保留 | — |

## 移除的 prod 區塊

- Brand story「我們相信，眼鏡不只是工具…」
- 「我們提供什麼」（VALUES 3 卡，dark reversal）
- 「我們怎麼陪你」（驗光/選框/售後 3 卡）
- Footer CTA「下一副眼鏡」
- 試戴/測驗導引 2 卡（被區塊 4 的 editorial split 取代）

> 原型底部 4 價值的內容（免運/保固/清洗/鑑賞）其實涵蓋了被移除區塊的精華，
> 不會掉資訊量，只是從長文敘事改成精煉展示。

## 資料層改動

`src/lib/products.ts`：現有 `getFeaturedProducts` / `getNewArrivals` 不分 kind。
新增 optional `kind` 參數（不破壞既有呼叫）：

```ts
getFeaturedProducts(limit = 8, kind?: ProductKind)
getNewArrivals(limit = 8, kind?: ProductKind)
```

- 區塊 3 成品太陽眼鏡：先 `getFeaturedProducts(8, "finished")`，數量不足時
  以 `getNewArrivals(8, "finished")` 補（避免新店家還沒設 featured 就空白）。
- 區塊 6 新進框型：`getNewArrivals(8, "prescription_frame")`。
- 區塊 1 HeroCarousel：`getFeaturedProducts(6)`（不分 kind，全站精選）；
  fallback 最新。

防禦性同現有 helper：query 失敗回空陣列，該區塊自行隱藏（`length > 0` 才渲染）。

## 元件改動

- **`HeroCarousel`**（`src/components/site/HeroCarousel.tsx`）：目前吃
  `slides: {src, alt}[]`。改造成吃 `ProductCardData[]`，輪播商品圖 + 名稱 +
  價格，可點進 `/products/[slug]`。保留現有輪播互動/無障礙。
  - 若他處有用到舊 `slides` 介面 → grep 確認；只有首頁用 → 直接改 props。
- **`Marquee`**（新，`src/components/site/Marquee.tsx`）：水平無限跑馬燈，
  `prefers-reduced-motion` 時靜止。純展示、`aria-hidden`。
- 區塊 4 / 5 / 7 為首頁內 section，直接寫在 `page.tsx`（跟現有區塊一致，
  不過度抽元件；若某塊複雜再抽）。

## 視覺 / token

全部沿用現有設計系統：`eyebrow`、`font-serif`、`text-gold`、`bg-bg-deep`、
`--accent`、`buttonVariants`、`Reveal` 進場動畫、`container`。不新增色彩/字型。
處方 CTA banner 用深色底（`bg-bg-deep` 或 dark reversal，比照原型 `.cta-banner`）。

## 風險 / 取捨

- **效能預算**：首頁是公開頁，warm TTFB < 300ms（見 `docs/scaling.md`）。
  新增區塊都是 server component + 既有 query，HeroCarousel 商品圖用 next/image。
  多 2 次 `getFeaturedProducts/getNewArrivals`（分 kind）→ 與現有 2 次同量級，
  可用 `Promise.all` 併發。需量測 warm 數字，若超標在 PR 標出。
- **Header auth 已使 route 動態**（`docs/scaling.md` #3），首頁本就 dynamic，
  本次不改變這個前提。
- HeroCarousel 改 props 是 breaking change（內部元件），grep 確認只有首頁用。

## 測試要點

- 首頁 8 區塊順序、各區塊 `length > 0` 隱藏邏輯
- HeroCarousel 商品可點、輪播、無障礙、reduced-motion
- Marquee reduced-motion 靜止
- 成品/處方 grid 分 kind 正確、featured fallback 最新
- 深淺主題下處方 CTA banner 對比正常
- 既有 `getFeaturedProducts/getNewArrivals` 無參數呼叫不受影響（向後相容）
- warm 效能量測
