# Nexbuy Supabase + Vercel 部署指南

本文件詳細說明如何將 Nexbuy 從 ASP.NET Core + MSSQL 遷移至 Supabase + Vercel 架構。

---

## 目錄

1. [建立 Supabase 專案](#1-建立-supabase-專案)
2. [設定環境變數](#2-設定環境變數)
3. [安裝前端依賴](#3-安裝前端依賴)
4. [安裝 Supabase CLI 並連結專案](#4-安裝-supabase-cli-並連結專案)
5. [推送資料庫 Migration](#5-推送資料庫-migration)
6. [部署 Edge Functions](#6-部署-edge-functions)
7. [設定 pg_cron 背景排程](#7-設定-pg_cron-背景排程)
8. [本機啟動前端測試](#8-本機啟動前端測試)
9. [部署前端至 Vercel](#9-部署前端至-vercel)
10. [驗證測試清單](#10-驗證測試清單)

---

## 1. 建立 Supabase 專案

### 1.1 註冊 / 登入 Supabase

1. 前往 https://supabase.com
2. 點擊 **Start your project** 或 **Sign In**
3. 可使用 GitHub 帳號直接登入

### 1.2 建立新專案

1. 進入 Dashboard 後，點擊 **New Project**
2. 選擇你的 **Organization**（首次使用會自動建立一個）
3. 填寫以下資訊：
   - **Name**: `Nexbuy`（或任意名稱）
   - **Database Password**: 設定一組強密碼（請記下來，後續可能用到）
   - **Region**: 選擇離你最近的區域（例如 `Northeast Asia (Tokyo)` 或 `South Asia (Mumbai)`）
4. 點擊 **Create new project**
5. 等待約 1-2 分鐘，專案初始化完成

### 1.3 記錄重要資訊

專案建立後，前往 **Project Settings > API**（左側選單最底下的齒輪圖示），記錄以下資訊：

| 欄位 | 位置 | 用途 |
|------|------|------|
| **Project URL** | API Settings 頁面頂部 | 前端連線用 |
| **anon public key** | Project API keys 區塊 | 前端公開呼叫用 |
| **service_role key** | Project API keys 區塊 | Edge Functions 後端用（請勿外洩） |

> **注意**: `anon public key` 通常是 `eyJhbGci...` 開頭的 JWT 格式。較新版 Supabase 可能顯示為 `sb_publishable_...` 格式，兩者皆可使用。

---

## 2. 設定環境變數

### 2.1 建立 .env.local

在 `nexbuy-supabase/` 目錄下建立 `.env.local` 檔案：

```bash
cd nexbuy-supabase
cp .env.local.example .env.local
```

### 2.2 填入你的 Supabase 資訊

編輯 `.env.local`，將佔位文字替換成你的實際值：

```env
VITE_SUPABASE_URL=https://你的專案ID.supabase.co
VITE_SUPABASE_ANON_KEY=你的anon-public-key
```

**範例**：
```env
VITE_SUPABASE_URL=https://fmjwmiiywgnruppgqdnf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
```

> **安全提醒**:
> - `.env.local` 已在 `.gitignore` 中，不會被 commit
> - `VITE_` 開頭的變數會暴露在前端，只放 anon key（公開安全的）
> - 絕對不要將 `service_role` key 放在前端

---

## 3. 安裝前端依賴

### 3.1 前置條件

確認已安裝 Node.js（建議 v18 以上）：

```bash
node --version    # 應顯示 v18.x 或以上
npm --version     # 應顯示 9.x 或以上
```

### 3.2 安裝依賴

```bash
cd nexbuy-supabase
npm install
```

預期輸出：
```
added 115 packages, and audited 116 packages in 30s
found 0 vulnerabilities
```

### 3.3 主要依賴說明

| 套件 | 用途 |
|------|------|
| `@supabase/supabase-js` | Supabase JavaScript SDK（取代 axios） |
| `vue` / `vue-router` / `pinia` | Vue 3 核心框架 |
| `naive-ui` | UI 元件庫 |
| `vue-i18n` | 多語言支援（繁中/英/日） |

---

## 4. 安裝 Supabase CLI 並連結專案

### 4.1 安裝 Supabase CLI

**方法 A - macOS (Homebrew)**：
```bash
brew install supabase/tap/supabase
```

**方法 B - Windows (Scoop)**：
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**方法 C - Linux (直接下載二進位)**：
```bash
# 取得最新版本
VERSION=$(curl -s https://api.github.com/repos/supabase/cli/releases/latest | grep tag_name | cut -d '"' -f 4 | sed 's/v//')

# 下載並安裝 (x86_64)
curl -fsSL "https://github.com/supabase/cli/releases/download/v${VERSION}/supabase_linux_amd64.tar.gz" -o /tmp/supabase.tar.gz
tar -xzf /tmp/supabase.tar.gz -C /tmp supabase
sudo mv /tmp/supabase /usr/local/bin/supabase
sudo chmod +x /usr/local/bin/supabase
```

**方法 D - 透過 npx（無需安裝）**：
```bash
npx supabase --version
```

驗證安裝：
```bash
supabase --version
# 應顯示版本號，例如 2.91.0
```

### 4.2 登入 Supabase CLI

**互動式登入（本機有瀏覽器時）**：
```bash
supabase login
```
會自動打開瀏覽器進行授權。

**Token 登入（伺服器/CI 環境）**：

1. 前往 https://supabase.com/dashboard/account/tokens
2. 點擊 **Generate new token**
3. 命名為 `cli`，然後複製 token
4. 設定環境變數：

```bash
export SUPABASE_ACCESS_TOKEN=你的token
```

或在 `.bashrc` / `.zshrc` 中加入以便永久生效。

驗證登入：
```bash
supabase projects list
```
應該能看到你的專案列表。

### 4.3 連結專案

```bash
cd nexbuy-supabase
supabase link --project-ref 你的專案ID
```

**專案 ID** 就是 Project URL 中的子域名部分，例如：
- URL: `https://fmjwmiiywgnruppgqdnf.supabase.co`
- 專案 ID: `fmjwmiiywgnruppgqdnf`

也可以從 `supabase projects list` 的 `REFERENCE ID` 欄位取得。

預期輸出：
```
Finished supabase link.
```

如果看到 `major_version` 警告，請按提示更新 `supabase/config.toml` 中的版本號。

---

## 5. 推送資料庫 Migration

### 5.1 Migration 檔案說明

`supabase/migrations/` 下有 7 個依序執行的 SQL 檔案：

| 檔案 | 內容 | 說明 |
|------|------|------|
| `00001_initial_schema.sql` | 18 張資料表 + 12 個 Enum | 從 MSSQL 轉換的完整 schema |
| `00002_rls_policies.sql` | Row Level Security | 所有表的存取權限政策 |
| `00003_functions.sql` | 商業邏輯函式 | `create_order()`, `cancel_order()`, `return_order()` |
| `00004_triggers.sql` | 資料庫觸發器 | 自動建 profile、訂單完成發點數、付款狀態同步 |
| `00005_storage.sql` | Storage Buckets | 商品圖片（公開）、數位下載（私有） |
| `00006_cron_jobs.sql` | 背景任務函式 | 積點過期、下載 token 過期（函式定義） |
| `00007_seed_data.sql` | 初始資料 | 管理員、分類、商品、運費、優惠券 |

### 5.2 執行推送

```bash
cd nexbuy-supabase
supabase db push
```

系統會列出所有待推送的 migration 檔案，輸入 `Y` 確認：

```
Do you want to push these migrations to the remote database?
 • 00001_initial_schema.sql
 • 00002_rls_policies.sql
 • 00003_functions.sql
 • 00004_triggers.sql
 • 00005_storage.sql
 • 00006_cron_jobs.sql
 • 00007_seed_data.sql

 [Y/n] Y
```

預期輸出：
```
Applying migration 00001_initial_schema.sql...
Applying migration 00002_rls_policies.sql...
Applying migration 00003_functions.sql...
Applying migration 00004_triggers.sql...
Applying migration 00005_storage.sql...
Applying migration 00006_cron_jobs.sql...
Applying migration 00007_seed_data.sql...
Finished supabase db push.
```

### 5.3 驗證資料庫

前往 Supabase Dashboard > **Table Editor** 確認：

- 應看到 18 張表：`profiles`, `admins`, `categories`, `products`, `product_translations`, `product_images`, `product_variants`, `orders`, `order_items`, `order_coupons`, `coupons`, `points`, `point_rules`, `digital_downloads`, `user_addresses`, `wishlists`, `shipping_methods`, `cart_items`
- `categories` 表應有 7 筆資料（3 個根分類 + 4 個子分類）
- `products` 表應有 6 筆商品
- `shipping_methods` 表應有 3 筆運送方式
- `coupons` 表應有 2 筆優惠券
- `admins` 表應有 1 筆管理員

### 5.4 常見問題

**Q: 出現 `gen_random_bytes` 不存在的錯誤**
A: 這是 pgcrypto extension 路徑問題。確認 migration 中使用 `CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;`，且 token 預設值使用 `replace(gen_random_uuid()::text, '-', '')` 而非 `encode(gen_random_bytes(32), 'hex')`。

**Q: 出現 `crypt` 或 `gen_salt` 不存在的錯誤**
A: 在 seed data 中使用 `extensions.crypt()` 和 `extensions.gen_salt()` 加上 schema 前綴。

**Q: Migration 推送失敗後想重來**
A: 在 Dashboard > SQL Editor 執行 `DELETE FROM supabase_migrations.schema_migrations;`，然後重新執行 `supabase db push`。但注意這不會自動 rollback 已建立的表，可能需要手動清理。

---

## 6. 部署 Edge Functions

### 6.1 Edge Functions 說明

| 函式名稱 | 用途 | 對應原始 C# Service |
|----------|------|---------------------|
| `admin-auth` | 管理員登入（BCrypt 驗證 + 自簽 JWT） | AuthService.AdminLoginAsync |
| `create-order` | 建立訂單（呼叫 PG 函式） | OrderService.CreateOrderAsync |
| `cancel-order` | 取消訂單 + 恢復庫存 | OrderService.CancelOrderAsync |
| `manage-cart` | 購物車操作（新增/合併/優惠券） | CartService |
| `download` | 數位下載（token 驗證 + 計數） | OrderService.ExecuteDownloadAsync |
| `admin-products` | 商品 CRUD + 分類管理 | AdminProductService |
| `admin-orders` | 訂單管理 + 狀態更新 + 匯出 | AdminOrderService |
| `admin-members` | 會員管理 + 點數調整 + 匯出 | AdminMemberService |
| `admin-coupons` | 優惠券 CRUD | AdminPromotionService |
| `admin-points` | 點數規則管理 | AdminPointService |
| `admin-reports` | 銷售/商品/訂單報表 | AdminReportService |

### 6.2 一鍵部署所有 Functions

```bash
cd nexbuy-supabase
supabase functions deploy --no-verify-jwt
```

`--no-verify-jwt` 旗標表示 Functions 自行處理驗證（而非讓 Supabase Gateway 驗證），因為我們的 admin 函式使用自簽 JWT。

預期輸出：
```
Deployed Functions on project xxxxx:
admin-auth, admin-coupons, admin-members, admin-orders,
admin-points, admin-products, admin-reports,
cancel-order, create-order, download, manage-cart
```

### 6.3 部署單一 Function（更新時使用）

```bash
supabase functions deploy create-order --no-verify-jwt
```

### 6.4 驗證部署

1. 前往 Dashboard > **Edge Functions**
2. 應看到 11 個函式，狀態皆為 `Active`
3. 測試 admin-auth：

```bash
curl -X POST \
  'https://你的專案ID.supabase.co/functions/v1/admin-auth' \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@nexbuy.local","password":"Admin123!"}'
```

預期回傳：
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "user": { "id": "...", "email": "admin@nexbuy.local", "name": "系統管理員", "role": "super_admin" }
  }
}
```

### 6.5 查看 Function 日誌

```bash
supabase functions logs admin-auth
```

或在 Dashboard > Edge Functions > 選擇函式 > **Logs** 標籤頁。

---

## 7. 設定 pg_cron 背景排程

### 7.1 排程說明

| 排程 | Cron 表達式 | 功能 | 取代原始 Hangfire Job |
|------|------------|------|----------------------|
| `expire-points` | `0 2 * * *` | 每天凌晨 2:00 UTC 清理過期積點 | ExpirePointsJob |
| `expire-download-tokens` | `0 * * * *` | 每小時清理過期下載 token | ExpireDownloadTokensJob |

> **注意**：訂單完成後的點數發放（原 `GrantOrderPointsJob`）已改為資料庫觸發器，訂單狀態變更為 `completed` 時立即觸發，不需要排程。

### 7.2 建立排程

**方法 A - 使用 Supabase CLI**：
```bash
supabase db query --linked \
  "SELECT cron.schedule('expire-points', '0 2 * * *', 'SELECT public.expire_points()');"

supabase db query --linked \
  "SELECT cron.schedule('expire-download-tokens', '0 * * * *', 'SELECT public.expire_download_tokens()');"
```

**方法 B - 使用 Supabase Dashboard SQL Editor**：

1. 前往 Dashboard > **SQL Editor**
2. 點擊 **New Query**
3. 貼上以下 SQL 並執行：

```sql
-- 啟用 pg_cron（如果尚未啟用）
CREATE EXTENSION IF NOT EXISTS pg_cron SCHEMA extensions;

-- 排程 1：每天凌晨 2:00 UTC 清理過期積點
SELECT cron.schedule(
  'expire-points',
  '0 2 * * *',
  'SELECT public.expire_points()'
);

-- 排程 2：每小時清理過期下載 token
SELECT cron.schedule(
  'expire-download-tokens',
  '0 * * * *',
  'SELECT public.expire_download_tokens()'
);
```

### 7.3 驗證排程

在 SQL Editor 執行：

```sql
SELECT * FROM cron.job;
```

應看到 2 筆排程記錄。

### 7.4 管理排程

```sql
-- 查看所有排程
SELECT * FROM cron.job;

-- 查看執行歷史
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- 刪除排程
SELECT cron.unschedule('expire-points');

-- 手動執行一次（測試用）
SELECT public.expire_points();
SELECT public.expire_download_tokens();
```

---

## 8. 本機啟動前端測試

### 8.1 啟動開發伺服器

```bash
cd nexbuy-supabase
npm run dev
```

預期輸出：
```
VITE v6.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 8.2 基本功能測試

打開瀏覽器前往 http://localhost:5173/，依序測試：

#### 測試 1：瀏覽商品（公開頁面）
- 首頁應顯示商品列表
- 點擊商品進入詳情頁，應顯示名稱、價格、圖片、描述
- 使用搜尋功能搜尋「手機」或「laptop」

#### 測試 2：使用者註冊 / 登入
- 前往 `/register` 註冊新帳號
- 填寫 Email、密碼（至少 6 字元）、姓名
- 註冊後應自動登入
- 前往 `/member/profile` 確認個人資料

#### 測試 3：購物車
- 在商品詳情頁點擊「加入購物車」
- 前往 `/cart` 查看購物車
- 測試修改數量、刪除商品
- 測試輸入優惠碼 `WELCOME10`（9折）或 `SAVE100`（折 100 元）

#### 測試 4：結帳
- 在購物車頁面點擊結帳
- 填寫收件資訊、選擇運送方式
- 確認訂單，應建立成功並導向成功頁面
- 前往 `/member/orders` 查看訂單歷史

#### 測試 5：管理後台
- 前往 `/admin/login`
- 帳號: `admin@nexbuy.local`
- 密碼: `Admin123!`
- 登入後測試：
  - 商品管理（新增/編輯/刪除）
  - 訂單管理（狀態更新）
  - 會員管理（查看/停用）
  - 優惠券管理
  - 報表查看

### 8.3 開發者工具檢查

打開瀏覽器 DevTools (F12)：

- **Network 標籤**：確認 API 呼叫指向你的 Supabase URL，而非 `localhost:5261`
- **Console 標籤**：檢查是否有錯誤訊息
- **Application > Local Storage**：確認 Supabase session 資料有寫入

---

## 9. 部署前端至 Vercel

### 9.1 前置條件

- 註冊 [Vercel](https://vercel.com) 帳號（可用 GitHub 登入）
- 將你的程式碼推到 GitHub repository

### 9.2 方法 A：透過 Vercel Dashboard（推薦）

1. 前往 https://vercel.com/new
2. 點擊 **Import Git Repository**，選擇你的 Nexbuy repo
3. 在設定頁面：
   - **Framework Preset**: 選擇 `Vue.js`
   - **Root Directory**: 輸入 `nexbuy-supabase`（因為前端在子目錄中）
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. 展開 **Environment Variables**，新增：

   | Key | Value |
   |-----|-------|
   | `VITE_SUPABASE_URL` | `https://你的專案ID.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | `你的anon-public-key` |

5. 點擊 **Deploy**
6. 等待建置完成，Vercel 會自動分配一個 URL（例如 `nexbuy-xxx.vercel.app`）

### 9.3 方法 B：透過 Vercel CLI

```bash
# 安裝 Vercel CLI
npm install -g vercel

# 登入
vercel login

# 部署（在 nexbuy-supabase 目錄下執行）
cd nexbuy-supabase
vercel

# 依提示操作：
# - Set up and deploy: Y
# - Which scope: 選你的帳號
# - Link to existing project: N
# - Project name: nexbuy
# - Directory: ./
# - Override settings: N
```

設定環境變數：
```bash
vercel env add VITE_SUPABASE_URL
# 輸入你的 Project URL

vercel env add VITE_SUPABASE_ANON_KEY
# 輸入你的 anon key

# 重新部署讓環境變數生效
vercel --prod
```

### 9.4 設定 Supabase 允許 Vercel 網域

部署完成後，需要將 Vercel URL 加入 Supabase 的允許清單：

1. 前往 Supabase Dashboard > **Authentication** > **URL Configuration**
2. 在 **Site URL** 填入你的 Vercel 正式 URL：
   ```
   https://nexbuy-xxx.vercel.app
   ```
3. 在 **Redirect URLs** 新增：
   ```
   https://nexbuy-xxx.vercel.app/**
   ```
4. 儲存

### 9.5 自訂網域（可選）

如果你有自己的網域：

1. 在 Vercel Dashboard > Project Settings > Domains 新增你的網域
2. 按照指示設定 DNS（CNAME 或 A record）
3. 同樣在 Supabase 的 URL Configuration 中更新為你的自訂網域

---

## 10. 驗證測試清單

部署完成後，請逐項測試以下功能：

### 公開功能

- [ ] 首頁載入，商品列表正常顯示
- [ ] 商品詳情頁顯示名稱、價格、圖片、描述
- [ ] 商品搜尋功能正常
- [ ] 分類篩選正常
- [ ] 語言切換（繁中/英文/日文）正常
- [ ] 未登入時瀏覽購物車（Guest Cart / localStorage）

### 使用者功能

- [ ] 註冊新帳號
- [ ] 登入 / 登出
- [ ] 忘記密碼（寄送重設信）
- [ ] 編輯個人資料
- [ ] 新增 / 編輯 / 刪除收件地址
- [ ] 加入購物車 / 修改數量 / 刪除
- [ ] 套用優惠券 `WELCOME10`（9折）
- [ ] 套用優惠券 `SAVE100`（折 100 元）
- [ ] 建立訂單（選擇運送方式、收件地址）
- [ ] 查看訂單列表與詳情
- [ ] 取消訂單（Pending 狀態）
- [ ] 加入 / 移除願望清單
- [ ] 查看點數歷史
- [ ] 登入時合併 Guest Cart

### 管理後台

- [ ] 管理員登入（`admin@nexbuy.local` / `Admin123!`）
- [ ] 商品列表 / 搜尋 / 篩選
- [ ] 新增商品（含翻譯、規格）
- [ ] 編輯 / 停用商品
- [ ] 分類管理（CRUD）
- [ ] 訂單列表 / 搜尋
- [ ] 更新訂單狀態（Pending → Paid → Processing → Shipped → Completed）
- [ ] 更新物流追蹤號碼
- [ ] 匯出訂單
- [ ] 會員列表 / 搜尋
- [ ] 停用 / 啟用會員
- [ ] 調整會員點數
- [ ] 匯出會員
- [ ] 優惠券管理（新增/編輯/啟停用）
- [ ] 點數規則設定
- [ ] 銷售報表
- [ ] 熱門商品報表
- [ ] 訂單趨勢報表

### 背景任務

- [ ] 手動執行 `SELECT public.expire_points();` 確認無錯誤
- [ ] 手動執行 `SELECT public.expire_download_tokens();` 確認無錯誤
- [ ] 將訂單狀態改為 `completed`，確認自動發放點數

---

## 附錄

### A. 架構對照表

| 原架構 | 新架構 |
|--------|--------|
| ASP.NET Core 8 REST API | Supabase Edge Functions (Deno) |
| MSSQL Server | Supabase PostgreSQL 17 |
| Entity Framework Core | Supabase SDK + RLS |
| 自建 JWT + BCrypt | Supabase Auth (使用者) + 自簽 JWT (管理員) |
| Hangfire 背景任務 | pg_cron + DB Triggers |
| 本機檔案儲存 (wwwroot/) | Supabase Storage Buckets |
| IIS / Kestrel | Vercel Edge Network |
| In-memory ConcurrentDictionary (購物車) | PostgreSQL cart_items 表 |

### B. 資料庫 Enum 對照表

| C# Enum (byte) | PostgreSQL Enum | 值 |
|-----------------|-----------------|-----|
| UserStatus | user_status | disabled, active |
| ProductType | product_type | physical, digital |
| ProductStatus | product_status | inactive, active |
| AddressType | address_type | regular, convenience_store |
| OrderStatus | order_status | pending, paid, processing, shipped, completed, cancelled |
| PaymentMethod | payment_method | manual_confirmation |
| PaymentStatus | payment_status | unpaid, paid, refunding, refunded |
| ShippingMethodType | shipping_method_type | home_delivery, seven_eleven, family_mart |
| CouponType | coupon_type | fixed_amount, percentage |
| CouponStatus | coupon_status | disabled, active |
| PointType | point_type | earn, redeem, expire, adjust |
| AdminRole | admin_role | super_admin, admin |

### C. Edge Function API 對照表

| 原始 API 路徑 | 新的呼叫方式 |
|---------------|-------------|
| `POST /api/v1/auth/login` | `supabase.auth.signInWithPassword()` |
| `POST /api/v1/auth/register` | `supabase.auth.signUp()` |
| `POST /api/v1/admin/auth/login` | `supabase.functions.invoke('admin-auth')` |
| `GET /api/v1/products` | `supabase.from('products').select(...)` |
| `GET /api/v1/categories` | `supabase.from('categories').select(...)` |
| `GET /api/v1/members/me` | `supabase.from('profiles').select(...)` |
| `POST /api/v1/orders` | `supabase.functions.invoke('create-order')` |
| `POST /api/v1/orders/:no/cancel` | `supabase.functions.invoke('cancel-order')` |
| `POST /api/v1/cart/items` | `supabase.functions.invoke('manage-cart')` |
| `GET /api/v1/downloads/:token` | `supabase.functions.invoke('download')` |
| `GET /api/v1/admin/products` | `supabase.functions.invoke('admin-products')` |
| `GET /api/v1/admin/orders` | `supabase.functions.invoke('admin-orders')` |
| `GET /api/v1/admin/members` | `supabase.functions.invoke('admin-members')` |
| `GET /api/v1/admin/coupons` | `supabase.functions.invoke('admin-coupons')` |
| `GET /api/v1/admin/points/rules` | `supabase.functions.invoke('admin-points')` |
| `GET /api/v1/admin/reports/*` | `supabase.functions.invoke('admin-reports')` |

### D. 費用估算（Supabase Free Tier）

| 項目 | 免費額度 | 預估使用量 |
|------|---------|-----------|
| Database | 500 MB | 初始 < 10 MB |
| Storage | 1 GB | 依商品圖片量 |
| Edge Functions | 500K invocations/月 | 小型電商足夠 |
| Auth | 50K MAU | 小型電商足夠 |
| Bandwidth | 5 GB | 依流量 |

> 小型電商專案在 Free Tier 下可完全免費運作。當業務成長時，可升級至 Pro Plan ($25/月)。
