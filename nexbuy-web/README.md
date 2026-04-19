# Nexbuy Web (Next.js + Supabase + Vercel)

眼鏡朋友線上通路 MVP。成品直購 + 處方預約到店。

## Stack

- **Next.js 16** (App Router + Turbopack)
- **React 19**
- **TypeScript** strict
- **Tailwind CSS 4** + shadcn/ui
- **Supabase**：Auth + Postgres + Storage + Edge Functions + pg_cron
- **Resend**：交易信
- **Zod**：schema validation
- **next-intl**：i18n (架構預留)

## 目錄

```
nexbuy-web/
├─ src/
│  ├─ app/                 App Router routes
│  ├─ components/ui/       shadcn/ui 元件
│  └─ lib/
│     ├─ env.ts            Zod 驗證的環境變數
│     ├─ supabase/
│     │  ├─ client.ts      Browser client
│     │  ├─ server.ts      Server Component / Route Handler client
│     │  └─ admin.ts       Service role (bypass RLS; 只在 server 用)
│     └─ utils.ts          shadcn cn() helper
└─ supabase/
   ├─ config.toml
   ├─ migrations/
   │  ├─ 20260419000000_init.sql    tables + RPC
   │  └─ 20260419000001_rls.sql     RLS policies
   └─ seed.sql              `supabase db reset` 自動跑
```

## 第一次啟動

### 1. 本機 Supabase

```bash
# Docker 要先開
supabase start
# 輸出會顯示 ANON_KEY / SERVICE_ROLE_KEY / API URL，複製
```

### 2. 環境變數

```bash
cp .env.local.example .env.local
# 填入 supabase start 輸出的 URL / keys
# Resend 可以先空著 (email 功能還沒寫，但 src/lib/env.ts 會 validate 非空；
# 暫時可以先塞 dummy 值讓 pnpm dev 過 schema validate)
```

### 3. 跑起來

```bash
pnpm dev
# http://localhost:3000
```

### 4. Reset DB / 重 seed

```bash
supabase db reset
# 會重跑所有 migrations + seed.sql
```

## Schema 變更

絕對不要手動改 DB。所有變更都走新 migration：

```bash
supabase migration new add_something
# 編輯 supabase/migrations/{timestamp}_add_something.sql
supabase db reset   # 本機驗證
supabase db push    # 推到 cloud
```

## Admin 帳號

MVP 的 admin 判斷靠 JWT role claim：

1. 在 Supabase Dashboard > Authentication > Users 建帳號
2. 編輯該 user 的 `raw_user_meta_data`：`{ "role": "admin" }`
3. Supabase `auth.jwt() ->> 'role' = 'admin'` 判斷

TODO: 未來換成 `admin_users` table 做多角色 / 權限分級。

## 上線 checklist (未完成)

- [ ] 所有 table 開 RLS：`SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public'`
- [ ] Race condition test 通過
- [ ] Resend domain 驗證完成
- [ ] Vercel env vars 設好
- [ ] Admin 帳號的 JWT role claim 設成 'admin'

## 此 MVP 包含 / 不包含

**包含（this branch）：**
- Supabase schema + RLS + book_appointment/cancel_appointment RPC
- 基礎 lib (env 驗證、supabase client 三種)
- Seed data (8 款眼鏡 + 未來 7 天預約時段)

**不包含（Lane B 以後）：**
- 任何頁面 UI
- 結帳 / 付款流程
- Email 整合
- Admin 頁面
- Tests (Week 1 之後補)
