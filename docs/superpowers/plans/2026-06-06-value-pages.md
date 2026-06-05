# 加值頁重設計（門市 / 願望清單 / 比較）Plan

> REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Goal:** 重建/重設計 `/store`（門市）、`/wishlist`（願望清單，取代 placeholder）、`/compare`（鏡框比較）三頁，沿用 tokens + 共用元件（StoreInfoCard / ProductCard / AddToCartButton / useCompare）。

**前置：** worktree `.worktrees/feat/value-pages`（origin/dev）。先讀 conventions。Commit trailer `Co-authored-by: Claude <claude@anthropic.com>`。worktree 無 node_modules 先 `pnpm install --frozen-lockfile`。

**資料限制：** Product 無 `產地/重量/評分` 欄位 → compare 省略這三列（保留 類型/價格/框型/材質/尺寸/主色/臉型/庫存）。wishlist 為 server DB（`wishlist_items`），需登入（guest 無）。

## Task 1: Store 頁（`src/app/store/page.tsx`）+ MAX_COMPARE 4
- `/store` 重建：`.container py-12`，頁首（eyebrow OUR STORE + serif 標題 + 一句介紹），`<StoreInfoCard />`（已含地址/電話/營業/Maps 嵌入），加「交通/停車」「營業時間」等簡短資訊區塊（靜態文案）。metadata title 門市資訊。
- `src/lib/compare.ts`：`MAX_COMPARE` 由 3 → 4（match 設計稿「最多 4 副」）。（CompareToggle/CompareBar 文字自動跟著 MAX_COMPARE。）
- typecheck/lint 後 commit。

## Task 2: Wishlist 頁（`src/app/wishlist/page.tsx`，取代 placeholder）
- server component。`getWishlistProductIds()`（Set，未登入回空）。
- 未登入 → `redirect("/login?next=/wishlist")`（與 account/wishlist 一致）。
- 有登入：`createServerSupabase().from("products").select("id, slug, name, description, price_cents, image_urls, kind, finished_stock, is_online_available").in("id", Array.from(ids)).eq("is_online_available", true)`。
- 渲染：`.container py-10`，頁首（eyebrow WISHLIST + serif 標題「願望清單」），`ProductCard` grid（`[grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]`，`inWishlist` 一律 true、`isLoggedIn` true）。
- 空狀態：♡ 圖示 + 「還沒有收藏的鏡框」+ 逛商品 CTA。
- metadata title 願望清單。typecheck/lint 後 commit。

## Task 3: Compare 頁重設計（`src/app/compare/page.tsx`，client 子元件保留）
- 保留：URL `?ids=` SSR 來源、`MAX_COMPARE`(現 4)、`CompareUrlSync`/`CompareRemoveButton`/`CompareBar` client 邏輯、product 查詢（`.in("id", ids)`）。
- 重設計比較表（tokens）：最多 4 欄並列；header 每欄 = 商品圖(getProductImageUrl)+名(serif，連 PDP)+移除鈕；空欄 = 虛線「加入比較」→ /products。
- 逐列規格（省略無資料列）：類型(Badge)、售價(formatPrice，primary)、框形、鏡架尺寸、材質、主色、適合臉型(pills)、庫存(finished：N 副/已售完；處方：—)。
- **每欄 CTA**：finished → `<AddToCartButton>`（用既有 client 元件，product_id/slug/name/price_cents/image_url；缺貨 disabled）；prescription → 「預約到店配鏡」link `/appointment/book/{slug}`。（保留/或取代「去看商品」。）
- 空狀態（0 欄）：說明 + 逛商品 CTA（沿用既有文案精神）。
- `.container`，RWD（窄寬橫向捲動或堆疊）。typecheck/lint 後 commit。

## 驗證
- typecheck/lint/build。
- 複製 .env.local，`pnpm start`：`/store` 200（門市/Maps）、`/wishlist` 200 或 redirect /login（未登入 cookie → 預期 redirect；curl 看 3xx/200）、`/compare` 200（空狀態）、`/compare?ids=<兩個真實 id>` 顯示比較。
- 視覺/RWD/加入購物車/移除/Maps → 使用者最後驗。

## Self-Review 對照
門市(StoreInfoCard+介紹)✓ 願望(login-gated grid+空狀態)✓ 比較(4欄/逐列規格/移除清空/加入購物車/空狀態)✓ MAX_COMPARE→4✓。省略 compare 產地/重量/評分(無欄位)。
