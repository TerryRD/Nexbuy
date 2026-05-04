# Nexbuy 精鋐眼鏡行 — Product Roadmap

主軸：把目前的單次完成工具站，升級成能認得人、能輔助決策、店家管得動的零售系統。

## 已決定的跨領域選擇

- **Auth：Supabase Auth**（email + password、Google OAuth）
- **Email：Resend**（reminder、通知、marketing 用同一個 provider）
- **SMS：暫不做** — Phase 4 只做 email reminder；之後看需要再加 LINE Notify / 三竹 MITAKE
- **試戴透明 PNG：admin 上傳鏡框時呼叫 remove.bg API 自動去背**
- **評論：admin 審核制**

## Phase 1 — Foundation（auth + customers）

依賴：無（最先做）。
解鎖：所有後續 phase。

工作：
- Supabase Auth 整合（server + browser clients、middleware）
- `/login`、`/signup`、`/forgot-password`、`/auth/callback`
- Header 顯示登入狀態（登入連結 ↔ 我的帳號 / 登出）
- 加 `customers` table（PK = `auth.users.id`）+ auto-create trigger + RLS
- `orders` / `appointments` 加可空 `customer_id` FK
- 結帳 / 預約流程，登入則 attach `customer_id`
- `/account` 頁面：個資、訂單歷史、預約歷史
- `/admin/(protected)/customers` 客戶列表 + 詳情

工時：~10–12 天（拆 3 個 PR）。

### Phase 1 之外要做的設定（Supabase Dashboard）

Auth → Providers → Google：
1. Google Cloud Console 開 OAuth 2.0 client（Authorized redirect URI 填 Supabase 給的）
2. 把 client ID / secret 填進 Supabase
3. 確認 callback URL 在 Vercel domain 也加進 Allowed redirect URLs

## Phase 2 — 試戴 MVP

依賴：Phase 1（為了能存到 wishlist）。

工作：
- admin ProductForm 加 `try_on_image_url` 欄位
- 上傳鏡框時呼叫 remove.bg API 自動去背、存到 Supabase storage
- `/products/[slug]` 加「試戴」按鈕
- `/try-on/[slug]`：使用 face-api.js 偵測眼睛位置，自動 scale + 擺位
- 上傳自拍照 OR 開鏡頭拍一張
- 試戴結果可存到 wishlist（先存資料；UI 在 Phase 4）

工時：~7–9 天。

## Phase 3 — 決策輔助

依賴：Phase 1（auth）。

工作：
- 商品多角度照片：UI 改 carousel（schema 已是陣列）
- 商品 attribute schema：`face_shape`、`frame_size`、`material`、`color`
- `/products` filter UI 加新 chip group
- 比較功能：選 2–3 副 → `/compare?ids=...`

工時：~6–8 天。

## Phase 4 — 自助服務 + 提醒

依賴：Phase 1（auth）。

工作：
- wishlist：toggle 按鈕在商品卡 + `/products/[slug]`；列表在 `/account/wishlist`
- 訂單物流追蹤：`orders.shipping_status` 欄位、admin 可手動更新、客戶看得見
- 預約前一天 email reminder（既有 cron job `/api/cron/appointment-reminder` 已經有殼）：
  - 整合 Resend
  - HTML email template

工時：~8–10 天。

## Phase 5 — 店家後台升級

依賴：無。

工作：
- `/admin` 首頁 dashboard：今日預約、今日訂單、低庫存警示
- 低庫存警示：`products.finished_stock < 警戒值` 時 visual + email to admin
- `/admin/slots` 改 calendar view
- 商品 CSV 批次上架

工時：~10–12 天。

## Phase 6 — Growth + 驗光紀錄

依賴：Phase 1（customers）。

工作：
- 銷售報表：`/admin/reports`（時段、品牌、kind、狀態 breakdown）
- 驗光紀錄管理：`prescriptions` table（綁 `customer_id`）
- marketing email blasts：list、template、scheduling、Resend
  - `customers.marketing_opt_in`
  - admin `/admin/marketing` 介面

工時：~10–12 天。

## 進度

- 2026-05-02：roadmap 確認、Phase 1 開始
