# 商品列表 `/products` 重設計 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** 把 `/products` 列表重設計成設計稿樣式——kind-aware 頁首、可見的主篩選列（類型 + 框型 chip，<720px 橫向捲動）、結果列（共 N 副 + 清除篩選 + 排序下拉）、`.product-grid`、缺貨沉底、空狀態清除 CTA——沿用 phase 1 tokens/layout 與 phase 2 的共用 `ProductCard`。

**Architecture:** 維持現有 client-side 模型（page.tsx 一次撈 ≤500 件，`ProductsList` client 端篩選）。新增 client `SortSelect`（appearance-none 樣式化原生 select）+ 純排序工具；`ProductsList` 重排版面並整合排序與缺貨沉底；把「框型」從 collapsible `AttributeFilters` 提升到可見主篩選列，其餘屬性（臉型/尺寸/材質/主色）留在 collapsible「更多篩選」。

**Tech Stack:** Next.js 16 client component、Tailwind 4 + 設計 token、lucide-react、既有 `ProductCard`/`attribute-filter.ts`/`ProductFilter`(kind)。

**決策：** 無 rating 欄位 → 排序省略「評分最高」，提供 推薦(預設,維持 created_at 順序) / 價格低→高 / 價格高→高。缺貨款（finished 且 finished_stock<=0）不論排序一律沉底（`ProductCard` 已有灰階+缺貨徽章樣式，phase 2）。不動資料層、無 migration。

**前置：** worktree `.worktrees/feat/products-list`（基於 origin/dev，含 phase 1+2）。指令在 `nexbuy-web/`。Commit trailer：`Co-authored-by: Claude <claude@anthropic.com>`。

---

## 現況（已讀）
- `src/app/products/page.tsx`：server，撈 ≤500 件 + wishlist + user，傳給 `ProductsList`。**不需改**（除非排序需要 created_at 既有順序；已是 created_at desc）。
- `src/app/products/ProductsList.tsx`：client，`active`(kind)/`attrFilter`/`searchQuery` state，`useMemo` filtered，用 `ProductCard` 渲染，`max-w-5xl`。**主要改這支**。
- `src/app/products/AttributeFilters.tsx`：collapsible 屬性面板（框形/臉型/尺寸/材質/主色 chips + active tags + 清除）。**改**：移除「框形」ChipRow（提升到主篩選列），其餘保留。
- `src/components/site/ProductFilter.tsx`：kind 切換（全部/成品/處方）。可重用或被主篩選列取代。
- `src/app/products/attribute-filter.ts`：純 state/helpers。**不改**。

---

## Task 1: SortSelect 元件 + 排序工具

**Files:** `src/components/site/SortSelect.tsx`（新）、`src/app/products/sort.ts`（新）

- [ ] **Step 1: 排序工具 `src/app/products/sort.ts`**（純函式/型別，client 與其他都可 import）：
```ts
import type { Product } from "@/lib/types/database";

export type SortKey = "recommended" | "price_asc" | "price_desc";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recommended", label: "推薦" },
  { value: "price_asc", label: "價格低→高" },
  { value: "price_desc", label: "價格高→低" },
];

/** finished 且無庫存 = 缺貨。處方鏡框不論庫存皆視為有貨。 */
export function isSoldOut(p: Pick<Product, "kind" | "finished_stock">): boolean {
  return p.kind === "finished" && (p.finished_stock ?? 0) <= 0;
}

/**
 * 排序：缺貨款一律沉底（不論 sortKey）；其餘依 sortKey。
 * recommended 維持傳入順序（server 已 created_at desc）。
 * 用 index 當 tiebreaker 保持穩定排序。
 */
export function sortProducts<T extends Pick<Product, "kind" | "finished_stock" | "price_cents">>(
  items: T[],
  sortKey: SortKey,
): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const soldA = isSoldOut(a.item) ? 1 : 0;
      const soldB = isSoldOut(b.item) ? 1 : 0;
      if (soldA !== soldB) return soldA - soldB; // 缺貨沉底
      if (sortKey === "price_asc") return a.item.price_cents - b.item.price_cents || a.index - b.index;
      if (sortKey === "price_desc") return b.item.price_cents - a.item.price_cents || a.index - b.index;
      return a.index - b.index; // recommended：原順序
    })
    .map(({ item }) => item);
}
```

- [ ] **Step 2: `src/components/site/SortSelect.tsx`**（appearance-none 樣式化原生 select + chevron，深淺色可讀）：
```tsx
"use client";

import { ChevronDown } from "lucide-react";
import { SORT_OPTIONS, type SortKey } from "@/app/products/sort";

export function SortSelect({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (next: SortKey) => void;
}) {
  return (
    <div className="relative inline-flex items-center">
      <select
        aria-label="排序方式"
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        className="appearance-none rounded-full border border-border bg-card py-1.5 pl-4 pr-9 text-sm text-foreground transition-colors hover:border-ink-soft focus-visible:border-foreground focus-visible:outline-none"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 size-4 text-muted-foreground" aria-hidden />
    </div>
  );
}
```
> `hover:border-ink-soft` 用 phase1 的 `--color-ink-soft`（Tailwind `border-ink-soft`）。若該 utility 不存在則改 `hover:border-foreground/40`。`<option>` 在深色模式由瀏覽器繪製，globals 已有 `select option` 規範可讀性（如無則可接受系統預設）。

- [ ] **Step 3: verify** `pnpm typecheck`、`pnpm lint`（無新錯誤）。

- [ ] **Step 4: commit**
```
git add src/components/site/SortSelect.tsx src/app/products/sort.ts
git commit -m "feat(products): add SortSelect + sort util (price asc/desc, sold-out sinks)

Co-authored-by: Claude <claude@anthropic.com>"
```

---

## Task 2: ProductsList 重排版 + AttributeFilters 調整

**Files:** `src/app/products/ProductsList.tsx`、`src/app/products/AttributeFilters.tsx`

- [ ] **Step 1: AttributeFilters — 移除「框形」ChipRow**
在 `AttributeFilters.tsx` 的 panel 內刪掉「框形」那個 `<ChipRow label="框形" .../>`（框型改由主篩選列負責），其餘（臉型/尺寸/材質/主色）保留。active tags 區的 frameShape tag 也一併移除（避免重複；主篩選列自己顯示 active 態）。其餘邏輯不動。

- [ ] **Step 2: ProductsList — 新增 sort state + 整合**
- import：`import { SortSelect } from "@/components/site/SortSelect";` 與 `import { sortProducts, type SortKey } from "./sort";`、`import { FRAME_SHAPES } from "@/lib/schemas/product";`、lucide `X`。
- 新增 `const [sortKey, setSortKey] = useState<SortKey>("recommended");`
- `filtered` 之後再排序：`const sorted = useMemo(() => sortProducts(filtered, sortKey), [filtered, sortKey]);` 渲染改用 `sorted`。

- [ ] **Step 3: ProductsList — 版面重排（套設計 token / `.container`）**
- 外層 `div` 由 `mx-auto max-w-5xl px-4 py-10` 改為 `className="container py-10 md:py-14"`。
- 頁首：kind-aware 標題（沿用 `TITLE`）+ eyebrow + 說明。例：
```tsx
<header className="mb-8">
  <p className="eyebrow mb-2">{active === "prescription_frame" ? "PRESCRIPTION FRAMES" : active === "finished" ? "SUNGLASSES" : "ALL EYEWEAR"}</p>
  <h1 className="font-serif text-3xl font-medium tracking-tight md:text-4xl">{title}</h1>
  <p className="mt-2 max-w-prose text-sm text-muted-foreground">
    {active === "prescription_frame"
      ? "線上挑款，預約到店驗光配鏡。"
      : active === "finished"
      ? "成品太陽眼鏡，線上直接下單到家。"
      : "成品太陽眼鏡線上直購；處方鏡框線上挑款、到店配鏡。"}
  </p>
</header>
```

- [ ] **Step 4: ProductsList — 可見主篩選列（類型 + 框型 chip，<720 橫向捲動 full-bleed）**
建一個水平 chip 列；`<720px` 用 `overflow-x-auto` + 隱藏捲軸 + 負邊距 full-bleed。type chips = 全部/成品太陽眼鏡/處方鏡框（沿用 active/setActive + syncUrl）；框型 chips = `FRAME_SHAPES`（設 attrFilter.frameShape，點同個再次=取消）。chip 樣式沿用 AttributeFilters 既有的 active/inactive class（`border-primary bg-primary text-primary-foreground` / `border-border bg-card ...`）。
```tsx
<div className="mb-6 -mx-6 overflow-x-auto px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:overflow-visible md:px-0">
  <div className="flex w-max items-center gap-2 md:w-auto md:flex-wrap">
    {/* 類型 */}
    {([
      { v: null, label: "全部" },
      { v: "finished", label: "成品太陽眼鏡" },
      { v: "prescription_frame", label: "處方鏡框" },
    ] as const).map((t) => (
      <button key={t.label} type="button" onClick={() => handleChange(t.v)} aria-pressed={active === t.v}
        className={chipClass(active === t.v)}>{t.label}</button>
    ))}
    <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden />
    {/* 框型 */}
    {FRAME_SHAPES.map((fs) => (
      <button key={fs} type="button" aria-pressed={attrFilter.frameShape === fs}
        onClick={() => handleAttrChange({ ...attrFilter, frameShape: attrFilter.frameShape === fs ? null : fs })}
        className={chipClass(attrFilter.frameShape === fs)}>{fs}</button>
    ))}
  </div>
</div>
```
加一個 `chipClass` helper（檔內）：
```tsx
const chipClass = (active: boolean) =>
  `shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1 text-sm transition ${
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-card text-muted-foreground hover:border-foreground/40 hover:text-foreground"
  }`;
```
保留現有的搜尋框（`Search` Input）放在主篩選列下方或結果列附近（維持功能）。

- [ ] **Step 5: ProductsList — 結果列（共 N 副 + 清除篩選 + 排序）**
```tsx
<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
  <div className="flex items-center gap-3 text-sm text-muted-foreground">
    <span>共 {sorted.length} 副</span>
    {hasActiveFilters && (
      <button type="button" onClick={clearAll} className="inline-flex items-center gap-1 text-primary hover:underline">
        <X className="size-3.5" /> 清除篩選
      </button>
    )}
  </div>
  <SortSelect value={sortKey} onChange={setSortKey} />
</div>
```
其中：
```tsx
const hasActiveFilters =
  active !== null ||
  searchQuery.trim() !== "" ||
  attrFilter.faceShapes.length > 0 ||
  !!attrFilter.frameShape || !!attrFilter.frameSize || !!attrFilter.material || !!attrFilter.color;
const clearAll = () => {
  setActive(null);
  setAttrFilter(EMPTY_FILTER);
  setSearchQuery("");
  syncUrl(null, EMPTY_FILTER);
};
```
（import `EMPTY_FILTER` from `./attribute-filter`。）保留 collapsible `AttributeFilters`（更多屬性）放在結果列下方或主篩選列旁，維持功能。

- [ ] **Step 6: ProductsList — grid 改 `.product-grid` 風格**
把 `<ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">` 改為：
```tsx
<ul className="grid gap-x-5 gap-y-8 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))] md:gap-x-7 md:gap-y-12">
```
渲染 `sorted`（非 `filtered`）。`priority={idx < 4}`。

- [ ] **Step 7: ProductsList — 空狀態 + 清除 CTA**
```tsx
{sorted.length === 0 ? (
  <div className="py-16 text-center">
    <p className="text-muted-foreground">
      {searchQuery.trim() ? `找不到「${searchQuery.trim()}」相關商品。` : "沒有符合條件的商品。"}
    </p>
    {hasActiveFilters && (
      <button type="button" onClick={clearAll} className="mt-4 inline-flex items-center gap-1 rounded-full border border-border px-4 py-1.5 text-sm text-foreground hover:border-foreground/40">
        清除篩選
      </button>
    )}
  </div>
) : ( /* grid */ )}
```
保留 `truncated` 警示。

- [ ] **Step 8: verify** `pnpm typecheck`、`pnpm lint`（無新錯誤）、`pnpm build`（/products 編譯）。

- [ ] **Step 9: commit**
```
git add src/app/products/ProductsList.tsx src/app/products/AttributeFilters.tsx
git commit -m "feat(products): redesign list — visible type/frame-shape filter row, sort, sold-out sink, product-grid

Co-authored-by: Claude <claude@anthropic.com>"
```

---

## Task 3: 驗證
- [ ] `pnpm build` 全綠。
- [ ] 複製 `.env.local` 進 worktree（gitignored），`pnpm start`，curl：`/products` 200、含 排序下拉（`排序方式`/option 文字）、類型/框型 chip、共 N 副；`?kind=finished` / `?kind=prescription_frame` 200 且標題對。
- [ ] 視覺/RWD/排序/缺貨沉底/清除篩選 → 使用者最後一起人工驗。

## Self-Review 對照
- kind-aware 頁首 + eyebrow → Task 2 Step 3 ✓
- 可見類型+框型篩選列、<720 橫向捲動 → Task 2 Step 4 ✓
- 結果列 共 N 副 + 清除篩選 + 排序下拉（自訂外觀） → Task 1 + Task 2 Step 5 ✓
- product-grid 響應式 → Task 2 Step 6 ✓
- 缺貨沉底（不論排序）+ 灰階徽章（ProductCard 已有） → Task 1 sortProducts ✓
- 空狀態清除 CTA → Task 2 Step 7 ✓
- 評分最高排序省略（無 rating 欄位）→ 已記錄

> 不在範圍：rating 資料/排序、server-side 分頁（維持現有 client 模型與 500 軟上限）。
