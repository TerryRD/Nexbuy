# 技術規格文件（Tech Spec）
## B2C 購物網站

| 項目 | 內容 |
|------|------|
| 文件版本 | v1.0 |
| 建立日期 | 2026-04-08 |
| 對應 SA 版本 | v1.2 |
| 技術棧 | Vue 3 + Vite / .NET 8 Web API / MSSQL |

---

## 1. 資料庫 ERD（Entity Relationship）

### 1.1 實體清單

```
Users                會員
UserAddresses        會員收件地址
Admins               後台管理員
Products             商品
ProductTranslations  商品多語系內容
ProductImages        商品圖片
ProductVariants      商品規格（尺寸、顏色等）
Categories           商品分類
Orders               訂單
OrderItems           訂單明細
DigitalDownloads     數位商品下載紀錄
Points               積點明細
Coupons              優惠券
OrderCoupons         訂單使用優惠券
ShippingMethods      配送方式
Hangfire (系統)      背景排程（Job Store）
```

### 1.2 ERD 欄位定義

#### Users（會員）
| 欄位 | 型別 | 說明 |
|------|------|------|
| Id | UNIQUEIDENTIFIER PK | |
| Email | NVARCHAR(255) UNIQUE | |
| PasswordHash | NVARCHAR(512) | bcrypt |
| Name | NVARCHAR(100) | |
| Phone | NVARCHAR(20) | |
| PointBalance | INT DEFAULT 0 | 積點餘額 |
| PreferredLocale | NVARCHAR(10) | zh-TW / en / ja |
| Status | TINYINT | 0=停用 1=正常 |
| CreatedAt | DATETIME2 | |
| UpdatedAt | DATETIME2 | |

#### UserAddresses（收件地址）
| 欄位 | 型別 | 說明 |
|------|------|------|
| Id | UNIQUEIDENTIFIER PK | |
| UserId | UNIQUEIDENTIFIER FK → Users | |
| Label | NVARCHAR(50) | 如「家」、「公司」 |
| RecipientName | NVARCHAR(100) | |
| Phone | NVARCHAR(20) | |
| AddressType | TINYINT | 0=一般地址 1=超商取貨 |
| ZipCode | NVARCHAR(10) | |
| City | NVARCHAR(50) | |
| Address | NVARCHAR(255) | |
| StoreId | NVARCHAR(50) | 超商門市代碼 |
| StoreName | NVARCHAR(100) | 超商門市名稱 |
| IsDefault | BIT | |

#### Categories（商品分類）
| 欄位 | 型別 | 說明 |
|------|------|------|
| Id | INT PK IDENTITY | |
| ParentId | INT FK → Categories | NULL = 頂層 |
| Slug | NVARCHAR(100) UNIQUE | |
| SortOrder | INT DEFAULT 0 | |

#### Products（商品）
| 欄位 | 型別 | 說明 |
|------|------|------|
| Id | UNIQUEIDENTIFIER PK | |
| CategoryId | INT FK → Categories | |
| SKU | NVARCHAR(100) UNIQUE | |
| Type | TINYINT | 0=實體 1=數位 |
| Price | DECIMAL(10,2) | |
| Stock | INT | 數位商品可設 -1（無限） |
| MaxDownloads | INT | 數位商品下載次數上限 |
| DownloadExpiryHours | INT | 下載連結有效時數 |
| Status | TINYINT | 0=下架 1=上架 |
| CreatedAt | DATETIME2 | |
| UpdatedAt | DATETIME2 | |

#### ProductTranslations（商品多語系）
| 欄位 | 型別 | 說明 |
|------|------|------|
| Id | INT PK IDENTITY | |
| ProductId | UNIQUEIDENTIFIER FK → Products | |
| Locale | NVARCHAR(10) | zh-TW / en / ja |
| Name | NVARCHAR(255) | |
| Description | NVARCHAR(MAX) | |

#### ProductVariants（商品規格）
| 欄位 | 型別 | 說明 |
|------|------|------|
| Id | UNIQUEIDENTIFIER PK | |
| ProductId | UNIQUEIDENTIFIER FK → Products | |
| VariantName | NVARCHAR(100) | 如「紅色 / L」 |
| PriceAdjustment | DECIMAL(10,2) DEFAULT 0 | 加減價 |
| Stock | INT | |
| SKU | NVARCHAR(100) | |

#### Orders（訂單）
| 欄位 | 型別 | 說明 |
|------|------|------|
| Id | UNIQUEIDENTIFIER PK | |
| OrderNo | NVARCHAR(30) UNIQUE | 系統產生，如 ORD20260408XXXX |
| UserId | UNIQUEIDENTIFIER FK → Users | |
| Status | TINYINT | 0=待付款 1=已付款 2=備貨中 3=已出貨 4=已完成 5=已取消 |
| PaymentMethod | TINYINT | 0=人工確認（預設）; 預留其他 |
| PaymentStatus | TINYINT | 0=未付款 1=已付款 2=退款中 3=已退款 |
| ShippingMethod | TINYINT | 0=宅配 1=7-11 2=全家 |
| ShippingFee | DECIMAL(10,2) | |
| SubTotal | DECIMAL(10,2) | 折扣前小計 |
| DiscountAmount | DECIMAL(10,2) DEFAULT 0 | |
| PointDiscount | DECIMAL(10,2) DEFAULT 0 | 積點折抵 |
| TotalAmount | DECIMAL(10,2) | |
| RecipientName | NVARCHAR(100) | |
| RecipientPhone | NVARCHAR(20) | |
| ShippingAddress | NVARCHAR(255) | |
| StoreId | NVARCHAR(50) | 超商門市代碼 |
| TrackingNo | NVARCHAR(100) | 物流單號 |
| Note | NVARCHAR(500) | |
| CreatedAt | DATETIME2 | |
| UpdatedAt | DATETIME2 | |

> **庫存設計說明**：購物車不鎖庫存。庫存扣減發生在**訂單建立當下**（`POST /orders`）。若結帳時庫存不足，回傳 `PRODUCT_OUT_OF_STOCK` 錯誤，告知使用者該商品已無法購買。

#### OrderItems（訂單明細）
| 欄位 | 型別 | 說明 |
|------|------|------|
| Id | UNIQUEIDENTIFIER PK | |
| OrderId | UNIQUEIDENTIFIER FK → Orders | |
| ProductId | UNIQUEIDENTIFIER FK → Products | |
| VariantId | UNIQUEIDENTIFIER FK → ProductVariants NULL | |
| ProductName | NVARCHAR(255) | 快照，避免商品改名影響歷史 |
| UnitPrice | DECIMAL(10,2) | 下單當下價格快照 |
| Quantity | INT | |
| Subtotal | DECIMAL(10,2) | |

#### DigitalDownloads（數位下載紀錄）
| 欄位 | 型別 | 說明 |
|------|------|------|
| Id | UNIQUEIDENTIFIER PK | |
| OrderItemId | UNIQUEIDENTIFIER FK → OrderItems | |
| UserId | UNIQUEIDENTIFIER FK → Users | |
| Token | NVARCHAR(512) UNIQUE | 一次性 Token |
| DownloadCount | INT DEFAULT 0 | |
| MaxDownloads | INT | |
| ExpiresAt | DATETIME2 | |
| IsRevoked | BIT DEFAULT 0 | |

#### Points（積點明細）
| 欄位 | 型別 | 說明 |
|------|------|------|
| Id | UNIQUEIDENTIFIER PK | |
| UserId | UNIQUEIDENTIFIER FK → Users | |
| OrderId | UNIQUEIDENTIFIER FK → Orders NULL | |
| Type | TINYINT | 0=累點 1=折抵 2=到期失效 3=手動調整 |
| Amount | INT | 正數=增加 負數=扣除 |
| ExpiresAt | DATETIME2 NULL | |
| Note | NVARCHAR(255) | |
| CreatedAt | DATETIME2 | |

#### PointRules（積點規則）
| 欄位 | 型別 | 說明 |
|------|------|------|
| Id | INT PK IDENTITY | |
| EarnRate | DECIMAL(10,4) DEFAULT 0.01 | 消費金額 × EarnRate = 積點（預設 1:100，即每 NT$100 = 1 點） |
| RedeemRate | DECIMAL(10,4) DEFAULT 1.0 | 1 點折抵金額（預設 NT$1） |
| PointExpiryMonths | INT DEFAULT 12 | 積點有效月數 |
| UpdatedAt | DATETIME2 | |
| UpdatedBy | UNIQUEIDENTIFIER FK → Admins | |


| 欄位 | 型別 | 說明 |
|------|------|------|
| Id | INT PK IDENTITY | |
| Code | NVARCHAR(50) UNIQUE | |
| Type | TINYINT | 0=金額折抵 1=百分比折扣 |
| Value | DECIMAL(10,2) | |
| MinOrderAmount | DECIMAL(10,2) DEFAULT 0 | 最低消費門檻 |
| UsageLimit | INT NULL | NULL=無限制 |
| UsedCount | INT DEFAULT 0 | |
| StartAt | DATETIME2 | |
| ExpiredAt | DATETIME2 | |
| Status | TINYINT | 0=停用 1=啟用 |

---

## 2. API 清單

> Base URL：`/api/v1`  
> 驗證：除標示 `[Public]` 外，皆需帶 `Authorization: Bearer {token}`  
> 回傳格式：`{ success: bool, data: any, message: string }`

### 2.1 認證 Auth

| Method | Path | 說明 | 權限 |
|--------|------|------|------|
| POST | `/auth/register` | 會員註冊 | Public |
| POST | `/auth/login` | 會員登入，回傳 JWT | Public |
| POST | `/auth/refresh` | 刷新 Access Token | Public |
| POST | `/auth/logout` | 登出（廢棄 Refresh Token） | Member |
| POST | `/auth/forgot-password` | 寄送重設密碼信 | Public |
| POST | `/auth/reset-password` | 重設密碼 | Public |

### 2.2 會員 Member

| Method | Path | 說明 | 權限 |
|--------|------|------|------|
| GET | `/members/me` | 取得個人資料 | Member |
| PUT | `/members/me` | 更新個人資料 | Member |
| GET | `/members/me/addresses` | 取得收件地址列表 | Member |
| POST | `/members/me/addresses` | 新增收件地址 | Member |
| PUT | `/members/me/addresses/{id}` | 更新收件地址 | Member |
| DELETE | `/members/me/addresses/{id}` | 刪除收件地址 | Member |
| GET | `/members/me/points` | 積點餘額與明細 | Member |
| GET | `/members/me/wishlist` | 收藏商品列表 | Member |
| POST | `/members/me/wishlist/{productId}` | 加入收藏 | Member |
| DELETE | `/members/me/wishlist/{productId}` | 移除收藏 | Member |

### 2.3 商品 Product

| Method | Path | 說明 | 權限 |
|--------|------|------|------|
| GET | `/products` | 商品列表（分頁、篩選、排序） | Public |
| GET | `/products/{id}` | 商品詳細 | Public |
| GET | `/products/search` | 關鍵字搜尋 | Public |
| GET | `/categories` | 分類樹狀列表 | Public |
| GET | `/categories/{id}/products` | 分類下的商品 | Public |

### 2.4 購物車 Cart

| Method | Path | 說明 | 權限 |
|--------|------|------|------|
| GET | `/cart` | 取得購物車內容 | Public（含訪客） |
| POST | `/cart/items` | 加入商品 | Public |
| PUT | `/cart/items/{id}` | 更新數量 | Public |
| DELETE | `/cart/items/{id}` | 移除商品 | Public |
| POST | `/cart/merge` | 登入後合併訪客購物車 | Member |
| POST | `/cart/coupon` | 套用優惠券 | Public |
| DELETE | `/cart/coupon` | 移除優惠券 | Public |

### 2.5 訂單 Order

| Method | Path | 說明 | 權限 |
|--------|------|------|------|
| POST | `/orders` | 建立訂單（結帳） | Member |
| GET | `/orders` | 我的訂單列表 | Member |
| GET | `/orders/{orderNo}` | 訂單詳細 | Member |
| POST | `/orders/{orderNo}/cancel` | 取消訂單 | Member |
| POST | `/orders/{orderNo}/return` | 申請退換貨 | Member |
| GET | `/orders/{orderNo}/downloads` | 取得數位商品下載連結 | Member |
| GET | `/downloads/{token}` | 執行下載（驗證 Token） | Public |

### 2.6 積點 Points

| Method | Path | 說明 | 權限 |
|--------|------|------|------|
| GET | `/points/rules` | 取得積點規則（累點比例、兌換比例） | Public |

### 2.7 後台 — 商品管理 Admin/Products

| Method | Path | 說明 | 權限 |
|--------|------|------|------|
| GET | `/admin/products` | 商品列表（含下架） | Admin |
| POST | `/admin/products` | 新增商品 | Admin |
| PUT | `/admin/products/{id}` | 更新商品 | Admin |
| DELETE | `/admin/products/{id}` | 刪除商品 | Admin |
| POST | `/admin/products/{id}/images` | 上傳商品圖片 | Admin |
| DELETE | `/admin/products/{id}/images/{imageId}` | 刪除商品圖片 | Admin |
| GET | `/admin/categories` | 分類管理列表 | Admin |
| POST | `/admin/categories` | 新增分類 | Admin |
| PUT | `/admin/categories/{id}` | 更新分類 | Admin |
| DELETE | `/admin/categories/{id}` | 刪除分類 | Admin |

### 2.8 後台 — 訂單管理 Admin/Orders

| Method | Path | 說明 | 權限 |
|--------|------|------|------|
| GET | `/admin/orders` | 訂單列表（分頁、篩選） | Admin |
| GET | `/admin/orders/{orderNo}` | 訂單詳細 | Admin |
| PUT | `/admin/orders/{orderNo}/status` | 更新訂單狀態 | Admin |
| PUT | `/admin/orders/{orderNo}/tracking` | 登打物流單號 | Admin |
| GET | `/admin/orders/export` | 匯出訂單 Excel/CSV | Admin |

### 2.9 後台 — 會員管理 Admin/Members

| Method | Path | 說明 | 權限 |
|--------|------|------|------|
| GET | `/admin/members` | 會員列表 | Admin |
| GET | `/admin/members/{id}` | 會員詳細 | Admin |
| PUT | `/admin/members/{id}/status` | 啟用 / 停用會員 | Admin |
| POST | `/admin/members/{id}/points` | 手動調整積點 | Admin |
| GET | `/admin/members/export` | 匯出會員 CSV | Admin |

### 2.10 後台 — 促銷管理 Admin/Promotions

| Method | Path | 說明 | 權限 |
|--------|------|------|------|
| GET | `/admin/coupons` | 優惠券列表 | Admin |
| POST | `/admin/coupons` | 新增優惠券 | Admin |
| PUT | `/admin/coupons/{id}` | 更新優惠券 | Admin |
| PUT | `/admin/coupons/{id}/status` | 啟用 / 停用 | Admin |

### 2.11 後台 — 積點規則 Admin/Points

| Method | Path | 說明 | 權限 |
|--------|------|------|------|
| GET | `/admin/points/rules` | 取得積點規則 | Admin |
| PUT | `/admin/points/rules` | 更新積點規則 | Admin |

### 2.12 後台 — 報表 Admin/Reports

| Method | Path | 說明 | 權限 |
|--------|------|------|------|
| GET | `/admin/reports/sales` | 銷售統計（依日期區間） | Admin |
| GET | `/admin/reports/products/top` | 熱銷商品排行 | Admin |
| GET | `/admin/reports/orders/trend` | 訂單數量趨勢 | Admin |
| GET | `/admin/reports/sales/export` | 匯出銷售報表 Excel | Admin |

---

## 3. 背景排程（Hangfire Jobs）

| Job 名稱 | 觸發條件 | 說明 |
|---------|---------|------|
| `ExpireDownloadTokens` | 每小時 | 將過期的數位下載 Token 標記為 Revoked |
| `GrantOrderPoints` | 即時觸發（訂單狀態變更為「已完成」時） | 依 PointRules.EarnRate 計算並寫入 Points 明細，更新 Users.PointBalance |
| `ExpirePoints` | 每日凌晨 2:00 | 到期積點扣除，寫入 Points 明細 |

---

## 4. 共用回應格式

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

// 分頁列表
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

## 5. 錯誤碼定義（部分）

| ErrorCode | HTTP Status | 說明 |
|-----------|------------|------|
| `AUTH_INVALID_CREDENTIALS` | 401 | 帳號或密碼錯誤 |
| `AUTH_TOKEN_EXPIRED` | 401 | Token 過期 |
| `PRODUCT_NOT_FOUND` | 404 | 商品不存在 |
| `PRODUCT_OUT_OF_STOCK` | 422 | 商品庫存不足 |
| `COUPON_INVALID` | 422 | 優惠券無效或已過期 |
| `COUPON_USAGE_LIMIT` | 422 | 優惠券已達使用上限 |
| `ORDER_NOT_FOUND` | 404 | 訂單不存在 |
| `ORDER_CANNOT_CANCEL` | 422 | 訂單狀態不可取消 |
| `POINTS_GRANT_PENDING` | — | 積點於訂單完成後才發放（非錯誤，供前台提示用） |
| `DOWNLOAD_TOKEN_INVALID` | 403 | 下載 Token 無效或已過期 |
| `DOWNLOAD_LIMIT_EXCEEDED` | 403 | 超過下載次數上限 |
| `POINTS_INSUFFICIENT` | 422 | 積點不足 |

---

*文件狀態：v1.0 Draft — 供開發團隊內部審閱*
