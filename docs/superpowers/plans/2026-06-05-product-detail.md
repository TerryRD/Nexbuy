# 商品詳情 `/products/[slug]` 重設計 Plan

> REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Goal:** 把商品詳情頁重建成設計稿樣式：麵包屑、主圖+縮圖、分類 eyebrow、serif 商品名、價格、庫存狀態（僅剩 N 副/暫時缺貨）、顏色色票、尺寸 pill + 尺寸對照 Modal、數量 stepper + 加入購物車·金額（成品）/ 預約大按鈕 + 關於處方鏡框（處方）、購買保障 2×2、商品介紹/規格/保養分頁、同系列推薦 grid。沿用 tokens/layout + ProductCard。

**資料限制（沿用既有 schema）：** 無 rating → 省略星等/評論數；無原價欄位 → 省略刪除線；無 per-color 圖；無 per-product mm → 尺寸對照表用「依 S/M/L 的示意 mm + 量測提示」通用版；color 單一 → 顯示單一色票。

**前置：** worktree `.worktrees/feat/product-detail`（origin/dev）。指令在 `nexbuy-web/`。Commit trailer `Co-authored-by: Claude <claude@anthropic.com>`。先讀 conventions（金額 formatPrice、Next16 params Promise、server/client 邊界）。

## 現況
- `[slug]/page.tsx`（server，265 行）：撈 product + wishlist + user；`ProductImageCarousel`、`AddToCartButton`、`CompareToggle`、`WishlistToggle`、`ProductAttributes`（內部）。`max-w-5xl`。
- `AddToCartButton`：單顆按鈕（無 stepper），`useCart().add` 支援 quantity。
- `ProductImageCarousel`：主圖+縮圖+箭頭（保留沿用）。
- cart `add({...,quantity})`、`computeShippingCents`。

## Task 1: 新增/強化元件
**Files（皆在 `src/app/products/[slug]/`，除非另註）：**
- `Breadcrumb.tsx`（新，可放 components/site）：首頁 / 分類 / 商品名。
- `AddToCartButton.tsx`（改）：加數量 stepper（+/- ，1..10，對 `MAX_QTY_PER_ITEM`）、按鈕文字「加入購物車 · {formatPrice(price*qty)}」、加入後前往 /cart（沿用既有 router.push）。disabled（缺貨）維持。
- `SizeChartModal.tsx`（新，client）：用 `@base-ui/react` Dialog（若無則用原生 `<dialog>` 或 base-ui 既有；先驗證），觸發為「尺寸對照表」連結；內容：S/M/L 示意 mm 表（鏡片寬/鼻樑/鏡腳，通用示意值）+ 量測提示文字。
- `PurchaseGuarantee.tsx`（新）：2×2 卡，`kind` 決定內容（成品：免運到貨/七天鑑賞/一年保固/終身服務；處方：預約驗光/配鏡宅配/一年保固/終身服務），Lucide 圖示（truck/shield-check/refresh-cw/sparkles 等）。
- `ProductTabs.tsx`（新，client useState）：三分頁 商品介紹 / 規格 / 保養與保固。規格表用 product 屬性（編號=slug、類型、框形、材質、鏡架尺寸、主色、適合臉型）。保養與保固為靜態文案。

每個元件用設計 token（serif 標題、`.eyebrow`、border/card/primary）。typecheck + lint 後 commit（可分多 commit）。

## Task 2: page.tsx 重建
- 容器改 `.container py-10 md:py-14`。
- 麵包屑（Breadcrumb）置頂：首頁→分類(/products?kind=...)→商品名。
- 左欄：`ProductImageCarousel`（沿用）+ 下方「虛擬試戴 / 加入比較」小按鈕（試戴連 `/tryon?product=slug`，僅 try_on_image_url 有值或一律顯示；比較用 CompareToggle）。
- 右欄：分類 eyebrow + 編號（slug，mono）；商品名（serif h1）；brand（若有）；價格（serif/display）；
  - 成品：庫存 ≤5 且 >0 → 「僅剩 N 副」+ 橘點 `animate-pulse`；缺貨 → 「暫時缺貨 · 可加入收藏」、AddToCartButton disabled。
  - 顏色色票（product.color 單一，顯示一個 swatch + 名稱；無則略）。
  - 尺寸 pill（product.frame_size，顯示該尺寸 pill）+「尺寸對照表」開 `SizeChartModal`。
  - 成品：`AddToCartButton`（含 stepper）+ WishlistToggle。處方：「預約到店配鏡」大按鈕（連 `/appointment/book/slug`）+ WishlistToggle + CompareToggle + 「關於處方鏡框」說明卡。
  - `PurchaseGuarantee kind={product.kind}`。
- `ProductTabs`（描述/規格/保養）。
- 同系列推薦：query 同 kind（排除自身）`is_online_available` limit 4，用 `ProductCard` grid（沿用 phase2 卡）；空則不顯示。需要 wishlist 狀態傳入。
- 保留 JsonLd / generateMetadata 不動。
- 維持 server component；互動元件皆 client。

## 驗證
- typecheck / lint / build。
- 複製 .env.local，`pnpm start`，curl 一個實際商品 slug（先 `curl /products` 抓一個 slug）→ 200、含 麵包屑、購買保障、分頁、尺寸對照表觸發、同系列推薦；成品看 stepper、處方看預約按鈕。
- 視覺/Modal/分頁/RWD → 使用者最後驗。

## Self-Review 對照
麵包屑✓ 主圖縮圖(沿用)✓ eyebrow+編號✓ serif名✓ 價格✓ 庫存態✓ 色票✓ 尺寸pill+Modal✓ stepper+加入購物車金額✓ 處方預約+說明卡✓ 保障2×2✓ 分頁✓ 同系列✓。省略：星等/評論(無rating)、原價刪除線(無欄位)。
