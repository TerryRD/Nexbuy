# 結帳流程重設計（購物車/結帳/訂單）Plan

> REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Goal:** 重設計 `/cart`、`/checkout`、`/orders/[orderNo]` 三頁為設計稿樣式（3 步 Stepper、免運進度條、inline 驗證 + 縣市 select + 同意條款、ATM 虛擬帳號卡 + 24h 倒數、4 階段狀態追蹤器、門市資訊），沿用 tokens/layout。**不動**資料層：`useCart`、`/api/orders`(place_order RPC)、3 路徑訂單授權、formatPrice、computeShippingCents 全保留。

**前置：** worktree `.worktrees/feat/checkout-flow`（origin/dev）。先讀 conventions（金額 cents/formatPrice、order-status.ts 單一來源、顧客授權三路徑、Next16 params Promise）。Commit trailer `Co-authored-by: Claude <claude@anthropic.com>`。worktree 若無 node_modules 先 `pnpm install --frozen-lockfile`。

## 現況（已 map）
- Cart：`src/app/cart/CartContents.tsx`(client，useCart) + page.tsx(server)。
- Checkout：`src/app/checkout/CheckoutForm.tsx`(client，hydration gate + POST /api/orders + clear + redirect `/orders/{no}?t={token}`) + page.tsx(server，hydrate defaults)。驗證目前 HTML5。
- Order：`src/app/orders/[orderNo]/page.tsx`(server，3 路徑授權，order fetch，hardcoded statusLabels)。欄位：order_no、payment_code(5碼)、status、total_cents/subtotal/shipping_fee、items、recipient_*、created_at、lookup_token。
- order-status.ts：`ORDER_STATUS_LABEL`/`ORDER_STATUS_BADGE`/`ORDER_STATUS_BORDER`（單一來源）。
- 無 Stepper 元件；address 為自由文字（無縣市 select）。

## Task 1: 共用元件 + 常數
**Files（components/site，除非註）：**
- `Stepper.tsx`（新）：props `steps: string[]`, `current: number`。橫向步驟指示（已完成/當前/未來態，用 primary/muted），RWD。
- `FreeShippingBar.tsx`（新, client 可純 props）：props `subtotalCents`。未達 300000 → 「再買 {formatPrice(300000-subtotal)} 即可免運」+ 進度條（width %）；達標 → 「✓ 已符合免運門檻」。用 primary 進度。
- `OrderStatusTracker.tsx`（新）：props `status: OrderStatus`。4 階段 待付款→已付款→已出貨→已完成；由 status 對映目前階段（pending_payment=0；paid/preparing=1；shipped=2；completed=3）；cancelled/refunded → 回傳 null（由頁面的取消/退款卡處理）。含時間戳可選（傳 createdAt 顯示在「待付款」下）。
- `src/lib/tw-cities.ts`（新）：`export const TW_CITIES: string[]`（22 縣市：臺北市/新北市/桃園市/臺中市/臺南市/高雄市/基隆市/新竹市/新竹縣/苗栗縣/彰化縣/南投縣/雲林縣/嘉義市/嘉義縣/屏東縣/宜蘭縣/花蓮縣/臺東縣/澎湖縣/金門縣/連江縣）。
- `src/app/orders/[orderNo]/PaymentCountdown.tsx`（新, client）：props `createdAt: string`。顯示距 createdAt+24h 的倒數（時:分:秒），到期顯示「付款期限已過，請聯絡門市」。`useEffect` setInterval 1s，reduced-motion 不影響。

typecheck/lint 後 commit。

## Task 2: Cart 重設計（CartContents.tsx）
- 外層 `.container py-10`，頂部 `<Stepper steps={["購物車","結帳資訊","完成訂單"]} current={0} />`。
- 保留 `useCart`（items/setQty/remove/subtotalCents）。item 列：縮圖（getProductImageUrl 或 image_url）、名稱(serif，連商品)、數量 stepper(± 用 setQty，1..10)、移除、單項小計。
- 右摘要：`<FreeShippingBar subtotalCents={subtotalCents} />`、小計、運費(computeShippingCents)、合計、`前往結帳` (Link /checkout)。
- 空車狀態（圖示 + 逛商品 CTA）。tokens 化。

## Task 3: Checkout 重設計（CheckoutForm.tsx，必要時 page.tsx）
- 外層 `.container`，頂部 `<Stepper current={1} />`。
- 表單欄位：收件人、手機、Email、**縣市 select**(TW_CITIES)、區(text)、地址(text)、備註。**inline 驗證**：client 端各欄錯誤訊息（`.err` 風格：mono、`text-destructive`、小字）——姓名必填、手機 `^0\d{8,9}$`、email 格式、縣市必填、區必填、地址必填(min)。送出前驗證，無效則聚焦/顯示錯誤不送出。
- **同意條款 checkbox**（必勾才能送出）。
- 付款方式：ATM 轉帳卡（沿用文案）。右側訂單摘要（小計/運費/合計）。
- **保留**：hydration gate、POST `/api/orders`（body：customer_name/email/phone、shipping_address = `${city}${district}${address}`、items、note）、錯誤處理(409/400)、`clear()` + `router.push('/orders/{no}?t={token}')`、isPending。
- 不改 `/api/orders` 與 schema（city/district 併進 shipping_address 字串）。

## Task 4: Order 重設計（orders/[orderNo]/page.tsx）
- 外層 `.container max-w-3xl`（或 container + inner max-w）。頂部可選 `<Stepper current={2} />`。
- **改用 `ORDER_STATUS_LABEL` from `@/lib/order-status`**（取代 hardcoded statusLabels；shipping label 可留或也集中）。
- `<OrderStatusTracker status={order.status} createdAt={order.created_at} />`（cancelled/refunded 時 tracker 回 null，保留既有退款/取消卡）。
- pending_payment：ATM 虛擬帳號卡（銀行/戶名/帳號/金額 formatPrice/備註 payment_code）+ `<PaymentCountdown createdAt={order.created_at} />`（24h）。
- 訂單明細（items + 小計/運費/合計）、寄送資訊、**門市資訊卡**（README 權威：桃園市桃園區同德里中埔六街 95 號、(03) 317-3639、週一–六 15:00–22:00、Maps 連結）。
- 保留 3 路徑授權、order fetch、refund/cancel 條件區塊、notFound。tokens 化。

## 驗證
- typecheck/lint/build。
- 複製 .env.local，`pnpm start`：`/cart` 200（空車或有貨）、`/checkout` 200（Stepper/表單/縣市 select/同意條款）；下單流程需登入/資料，至少確認頁面渲染（curl `/cart`、`/checkout` 200 + 關鍵字）。order 頁需真實 order_no，難 smoke → 以 build + typecheck 為主，視覺交使用者驗。
- 視覺/驗證/倒數/tracker/RWD → 使用者最後驗。

## Self-Review 對照
3步 Stepper(cart/checkout)✓ 免運進度條✓ inline驗證+縣市select+同意條款✓ ATM卡+24h倒數✓ 4階段tracker✓ 門市資訊✓ order-status單一來源✓ 保留 useCart/API/授權✓。
取捨：區為 text（無完整鄉鎮資料）；city/district 併入 shipping_address（不改 API）。
