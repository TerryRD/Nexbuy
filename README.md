# Nexbuy 眼鏡 — 線上通路 MVP

實體眼鏡店第一個線上通路：成品太陽眼鏡可線上直購、處方鏡架可線上預約到店配鏡。

## 技術棧

| 層級 | 技術 |
|------|------|
| 前端 + 後端 | Next.js 16 (App Router + Turbopack) |
| Runtime | React 19 + TypeScript strict |
| UI | Tailwind CSS 4 + shadcn/ui |
| 資料庫 / Auth / Storage | Supabase (Postgres + Row-Level Security) |
| 交易信 | Resend (T-24h reminder via Vercel Cron) |
| 驗證 | Zod |
| 多語系 | next-intl（架構預留，MVP 只啟用繁中） |
| 測試 | Vitest + Supabase local（Docker） |
| 部署 | Vercel（前端 + serverless API routes） |

## 目錄結構

```
nexbuy-web/         主要程式碼（一切都在這裡）
spec/               原始需求文件（SA Document、tech spec）
README.md           你現在看的
```

舊的 `Nexbuy/`（.NET 8）、`nexbuy-frontend/`（Vue）、`nexbuy-supabase/`（Vue + Supabase 實驗版）已移除 —— git history 仍保留。

## 快速開始

### 1. 啟本機 Supabase（需要 Docker Desktop）

```bash
cd nexbuy-web
supabase start
# 輸出記錄：API URL、anon key、service_role key
```

### 2. 環境變數

```bash
cp .env.local.example .env.local
# 把 supabase start 的 URL/keys 貼進去
# Resend 可先填 dummy（功能已寫但需要真 key 才會實際寄信）
```

### 3. Schema + seed

```bash
supabase db reset
# 跑：supabase/migrations/*.sql + supabase/seed.sql
# 8 副眼鏡 + 21 個未來 7 天的可預約時段
```

### 4. Dev server

```bash
pnpm install
pnpm dev
# http://localhost:3000
```

### 5. 測試

```bash
cp .env.test.example .env.test.local
# 填 supabase status 的 service_role key
pnpm test
# 9 個測試,包含 race condition 防雙預約
```

## 主要流程

**顧客（公開）：**
- `/` 首頁
- `/products?kind=finished|prescription_frame` 商品列表
- `/products/[slug]` 商品詳情
- 成品 → 加入購物車 → `/cart` → `/checkout` → `/orders/[orderNo]`（ATM 轉帳資訊）
- 處方 → `/appointment/book/[slug]` → `/appointment/[token]` 取消連結

**店家（admin）：**
- `/admin/login` 登入（JWT app_metadata.role = "admin"）
- `/admin/orders` 訂單管理（推進 待付款 → 已付款 → 已出貨 → 已完成）
- `/admin/appointments` 預約管理（標記 已完成 / 未到）
- `/admin/slots` 時段維護

## 部署

- 自動部署：push 到 `dev` / `main` → Vercel 自動 build
- Vercel 設定：Root Directory = `nexbuy-web`、Framework = Next.js
- env vars：Vercel Dashboard → Settings → Environment Variables

## 不在 MVP 範圍

金流串接、SMS / LINE 通知、超商取貨、POS 庫存同步、積點 / 優惠券、數位商品、多語系內容（架構預留但未啟用）

## 參與開發

- 用 worktree 開 feature branch：`git worktree add .worktrees/feat/<name> -b feat/<name>`
- PR 目標分支永遠是 `dev`
- Commit 訊息：conventional commits（feat / fix / chore / refactor）
