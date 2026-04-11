# Nexbuy - B2C 電子商務平台

多語系 B2C 購物網站，支援實體商品與數位商品混合銷售。

## 技術棧

| 層級 | 技術 |
|------|------|
| 前端 | Vue 3 + Vite + TypeScript |
| UI 元件庫 | Naive UI |
| 狀態管理 | Pinia |
| 多語系 | vue-i18n (繁中 / English / 日本語) |
| 後端 | .NET 8 Web API |
| ORM | Entity Framework Core 8 |
| 資料庫 | Microsoft SQL Server |
| 背景排程 | Hangfire |
| 認證 | JWT (Access Token + Refresh Token) |

---

## 環境需求

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) 或更新版本
- [Node.js 18+](https://nodejs.org/) (建議 v20 以上)
- [SQL Server](https://www.microsoft.com/sql-server) (LocalDB / Express / Developer 皆可)
- pnpm 或 npm

---

## 快速開始

### 1. Clone 專案

```bash
git clone https://github.com/Terry31415926/Nexbuy.git
cd Nexbuy
```

### 2. 設定資料庫連線

編輯 `Nexbuy/appsettings.json`，修改 `ConnectionStrings`：

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=Nexbuy;Trusted_Connection=True;TrustServerCertificate=True"
  }
}
```

> 如果使用 SQL Server 帳號密碼驗證：
> ```
> Server=localhost;Database=Nexbuy;User Id=sa;Password=你的密碼;TrustServerCertificate=True
> ```

### 3. 啟動後端

```bash
cd Nexbuy
dotnet run
```

首次啟動會自動：
- 建立資料庫及所有資料表
- 寫入預設管理員帳號、範例商品、分類、優惠券等 Seed Data

啟動後可訪問：
- API：http://localhost:5261
- Swagger UI：http://localhost:5261/swagger
- Hangfire Dashboard：http://localhost:5261/hangfire

### 4. 啟動前端

```bash
cd nexbuy-frontend
pnpm install   # 或 npm install
pnpm dev       # 或 npm run dev
```

前端開發伺服器：http://localhost:5173

> 前端已設定 Proxy，所有 `/api` 請求會自動轉發到後端 `http://localhost:5261`。

---

## 預設帳號

| 角色 | Email | 密碼 |
|------|-------|------|
| 後台管理員 | admin@nexbuy.local | Admin123! |

會員帳號請透過前台 `/register` 頁面自行註冊。

---

## 專案結構

```
Nexbuy/
├── Nexbuy/                    # .NET 8 後端
│   ├── Controllers/           # API 控制器 (16 個)
│   │   └── Admin/             # 後台管理 API
│   ├── Models/                # Entity Models (17 個)
│   │   └── Enums/             # 列舉定義
│   ├── Data/                  # DbContext + Seed Data
│   ├── DTOs/                  # Request / Response 資料傳輸物件
│   │   ├── Auth/
│   │   ├── Products/
│   │   ├── Cart/
│   │   ├── Orders/
│   │   ├── Members/
│   │   ├── Admin/
│   │   └── Common/            # ApiResponse, PagedResult
│   ├── Services/              # 商業邏輯 (11 個 Service)
│   │   ├── Interfaces/
│   │   └── Admin/
│   ├── Middleware/             # 例外處理、BusinessException
│   ├── Helpers/               # JWT、BCrypt、分頁
│   ├── Jobs/                  # Hangfire 背景排程
│   └── wwwroot/uploads/       # 商品圖片上傳目錄
│
├── nexbuy-frontend/           # Vue 3 前端
│   └── src/
│       ├── api/               # Axios API 模組
│       ├── layouts/           # DefaultLayout, AuthLayout, AdminLayout
│       ├── views/             # 38 個頁面
│       │   ├── public/        # 首頁、商品、購物車
│       │   ├── checkout/      # 結帳流程
│       │   ├── member/        # 會員中心
│       │   ├── auth/          # 登入、註冊
│       │   ├── admin/         # 後台管理 (17 頁)
│       │   └── download/      # 數位商品下載
│       ├── stores/            # Pinia 狀態管理
│       ├── router/            # Vue Router (38 條路由)
│       ├── locales/           # i18n 語系檔 (zh-TW, en, ja)
│       ├── types/             # TypeScript 型別定義
│       └── utils/             # 工具函式
│
└── spec/                      # 規格文件
    ├── sa_doc.md              # 系統分析文件
    ├── tech_spec.md           # 技術規格文件
    └── frontend_routes.md     # 前端路由規劃
```

---

## API 概覽

Base URL: `/api/v1`

### 公開 API (不需登入)

| 分類 | 端點 | 說明 |
|------|------|------|
| 認證 | `POST /auth/register` | 會員註冊 |
| 認證 | `POST /auth/login` | 會員登入 |
| 認證 | `POST /auth/refresh` | 刷新 Token |
| 認證 | `POST /auth/forgot-password` | 忘記密碼 |
| 認證 | `POST /auth/reset-password` | 重設密碼 |
| 商品 | `GET /products` | 商品列表 (分頁、排序、篩選) |
| 商品 | `GET /products/{id}` | 商品詳細 |
| 商品 | `GET /products/search?q=` | 搜尋商品 |
| 分類 | `GET /categories` | 分類樹 |
| 分類 | `GET /categories/{id}/products` | 分類下商品 |
| 購物車 | `GET /cart` | 取得購物車 |
| 購物車 | `POST /cart/items` | 加入商品 |
| 購物車 | `PUT /cart/items/{id}` | 更新數量 |
| 購物車 | `DELETE /cart/items/{id}` | 移除商品 |
| 購物車 | `POST /cart/coupon` | 套用優惠券 |
| 積點 | `GET /points/rules` | 積點規則 |
| 下載 | `GET /downloads/{token}` | 數位商品下載 |

### 會員 API (需登入)

| 分類 | 端點 | 說明 |
|------|------|------|
| 個人資料 | `GET /members/me` | 取得個人資料 |
| 個人資料 | `PUT /members/me` | 更新個人資料 |
| 地址 | `GET /members/me/addresses` | 收件地址列表 |
| 地址 | `POST /members/me/addresses` | 新增地址 |
| 地址 | `PUT /members/me/addresses/{id}` | 更新地址 |
| 地址 | `DELETE /members/me/addresses/{id}` | 刪除地址 |
| 積點 | `GET /members/me/points` | 積點明細 |
| 收藏 | `GET /members/me/wishlist` | 收藏清單 |
| 收藏 | `POST /members/me/wishlist/{productId}` | 加入收藏 |
| 收藏 | `DELETE /members/me/wishlist/{productId}` | 移除收藏 |
| 訂單 | `POST /orders` | 建立訂單 (結帳) |
| 訂單 | `GET /orders` | 我的訂單 |
| 訂單 | `GET /orders/{orderNo}` | 訂單詳細 |
| 訂單 | `POST /orders/{orderNo}/cancel` | 取消訂單 |
| 訂單 | `POST /orders/{orderNo}/return` | 申請退換貨 |
| 訂單 | `GET /orders/{orderNo}/downloads` | 數位商品下載連結 |

### 後台 API (需管理員登入)

| 分類 | 端點 | 說明 |
|------|------|------|
| 登入 | `POST /admin/auth/login` | 管理員登入 |
| 商品 | `GET/POST/PUT/DELETE /admin/products` | 商品 CRUD |
| 商品圖片 | `POST/DELETE /admin/products/{id}/images` | 圖片上傳/刪除 |
| 分類 | `GET/POST/PUT/DELETE /admin/categories` | 分類 CRUD |
| 訂單 | `GET /admin/orders` | 訂單列表 |
| 訂單 | `PUT /admin/orders/{orderNo}/status` | 更新訂單狀態 |
| 訂單 | `PUT /admin/orders/{orderNo}/tracking` | 登打物流單號 |
| 訂單 | `GET /admin/orders/export` | 匯出訂單 Excel |
| 會員 | `GET /admin/members` | 會員列表 |
| 會員 | `PUT /admin/members/{id}/status` | 啟用/停用會員 |
| 會員 | `POST /admin/members/{id}/points` | 手動調整積點 |
| 會員 | `GET /admin/members/export` | 匯出會員 CSV |
| 優惠券 | `GET/POST/PUT /admin/coupons` | 優惠券 CRUD |
| 積點規則 | `GET/PUT /admin/points/rules` | 積點規則管理 |
| 報表 | `GET /admin/reports/sales` | 銷售報表 |
| 報表 | `GET /admin/reports/products/top` | 熱銷商品排行 |
| 報表 | `GET /admin/reports/orders/trend` | 訂單趨勢 |
| 報表 | `GET /admin/reports/sales/export` | 匯出報表 Excel |

> 完整 API 文件請啟動後端後訪問 Swagger UI：http://localhost:5261/swagger

---

## 前端頁面一覽

### 前台

| 路徑 | 頁面 | 說明 |
|------|------|------|
| `/` | 首頁 | Banner、熱門商品、最新上架 |
| `/products` | 商品列表 | 分頁、排序、分類篩選 |
| `/category/:slug` | 分類頁 | 依分類顯示商品 |
| `/search?q=` | 搜尋結果 | 關鍵字搜尋 |
| `/products/:id` | 商品詳細 | 圖片輪播、規格選擇、加入購物車 |
| `/cart` | 購物車 | 數量調整、優惠券、結帳 |
| `/checkout` | 結帳 - 收件資訊 | 地址選擇、配送方式 |
| `/checkout/confirm` | 結帳 - 確認 | 訂單摘要、積點折抵 |
| `/checkout/success/:orderNo` | 結帳完成 | 訂單編號、後續說明 |

### 會員中心 (需登入)

| 路徑 | 頁面 |
|------|------|
| `/member` | 會員首頁 (積點餘額、最近訂單) |
| `/member/profile` | 個人資料編輯 |
| `/member/addresses` | 收件地址管理 |
| `/member/orders` | 我的訂單 |
| `/member/orders/:orderNo` | 訂單詳細 |
| `/member/points` | 積點明細 |
| `/member/wishlist` | 我的收藏 |

### 認證

| 路徑 | 頁面 |
|------|------|
| `/login` | 登入 |
| `/register` | 註冊 |
| `/forgot-password` | 忘記密碼 |
| `/reset-password` | 重設密碼 |

### 後台管理 (需管理員登入)

| 路徑 | 頁面 |
|------|------|
| `/admin/login` | 後台登入 |
| `/admin` | 儀表板 |
| `/admin/products` | 商品列表 |
| `/admin/products/create` | 新增商品 |
| `/admin/products/:id/edit` | 編輯商品 |
| `/admin/categories` | 分類管理 |
| `/admin/orders` | 訂單列表 |
| `/admin/orders/:orderNo` | 訂單詳細 |
| `/admin/members` | 會員列表 |
| `/admin/members/:id` | 會員詳細 |
| `/admin/coupons` | 優惠券列表 |
| `/admin/coupons/create` | 新增優惠券 |
| `/admin/coupons/:id/edit` | 編輯優惠券 |
| `/admin/points/rules` | 積點規則設定 |
| `/admin/reports/sales` | 銷售報表 |
| `/admin/reports/products` | 熱銷商品 |
| `/admin/reports/orders` | 訂單趨勢 |
| `/admin/settings/admins` | 管理員帳號管理 |

---

## 背景排程

| 排程 | 執行頻率 | 說明 |
|------|---------|------|
| ExpireDownloadTokens | 每小時 | 將過期的數位下載 Token 標記為失效 |
| GrantOrderPoints | 訂單完成時觸發 | 依消費金額計算並發放積點 |
| ExpirePoints | 每日凌晨 2:00 | 自動扣除到期積點 |

---

## 多語系支援

支援三種語系，可在前台右上角切換：

- 繁體中文 (zh-TW) - 預設
- English (en)
- 日本語 (ja)

商品名稱、描述支援後台逐語系維護。

---

## 統一 API 回應格式

```json
// 成功
{
  "success": true,
  "data": { ... },
  "message": null
}

// 失敗
{
  "success": false,
  "data": null,
  "message": "錯誤描述",
  "errorCode": "PRODUCT_OUT_OF_STOCK"
}

// 分頁
{
  "success": true,
  "data": {
    "items": [ ... ],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

---

## 開發備註

- 購物車**不鎖庫存**，庫存扣減在建立訂單時（`POST /orders`）執行
- 金流採 **Strategy Pattern** 設計，目前僅實作「人工確認付款」，可擴充其他支付方式
- 訪客購物車存在瀏覽器 localStorage，登入後自動合併到伺服器端
- 商品價格、名稱在建立訂單時會產生快照，避免後續修改影響歷史訂單
- 圖片上傳儲存於 `wwwroot/uploads/`，正式環境建議改用 Azure Blob Storage
