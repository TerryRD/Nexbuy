# 前端頁面清單 / Router 規劃
## B2C 購物網站（Vue 3 + Vue Router）

| 項目 | 內容 |
|------|------|
| 文件版本 | v1.0 |
| 建立日期 | 2026-04-08 |
| 框架 | Vue 3 + Vite + Vue Router 4 |

---

## 1. Layout 結構

```
App.vue
├── DefaultLayout        前台通用版型（Header + Footer）
│   └── 前台頁面
├── AuthLayout           登入 / 註冊版型（無 Header/Footer）
│   └── 認證頁面
└── AdminLayout          後台版型（側邊選單）
    └── 後台頁面
```

---

## 2. 前台路由（DefaultLayout）

### 2.1 一般頁面

| 頁面名稱 | Path | 元件 | 權限 | 說明 |
|---------|------|------|------|------|
| 首頁 | `/` | `HomeView` | Public | Banner 輪播、熱門商品、最新上架 |
| 商品列表 | `/products` | `ProductListView` | Public | 分頁、篩選、排序 |
| 商品分類 | `/category/:slug` | `CategoryView` | Public | 依分類顯示商品 |
| 商品搜尋 | `/search` | `SearchView` | Public | Query: `?q=關鍵字` |
| 商品詳細 | `/products/:id` | `ProductDetailView` | Public | 規格選擇、加入購物車 |
| 購物車 | `/cart` | `CartView` | Public | 訪客與會員皆可使用 |

### 2.2 結帳流程（步驟型）

| 頁面名稱 | Path | 元件 | 權限 | 說明 |
|---------|------|------|------|------|
| 結帳 — 收件資訊 | `/checkout` | `CheckoutView` | Member | 填寫地址、超商選擇 |
| 結帳 — 確認訂單 | `/checkout/confirm` | `CheckoutConfirmView` | Member | 最終確認、優惠券、積點折抵 |
| 結帳完成 | `/checkout/success/:orderNo` | `CheckoutSuccessView` | Member | 顯示訂單編號、後續說明 |

### 2.3 會員中心（需登入）

| 頁面名稱 | Path | 元件 | 權限 | 說明 |
|---------|------|------|------|------|
| 會員中心首頁 | `/member` | `MemberHomeView` | Member | 概覽：積點餘額、最近訂單 |
| 個人資料 | `/member/profile` | `MemberProfileView` | Member | 編輯姓名、電話、語系偏好 |
| 收件地址管理 | `/member/addresses` | `MemberAddressView` | Member | 新增 / 編輯 / 刪除地址 |
| 我的訂單 | `/member/orders` | `MemberOrderListView` | Member | 訂單列表、狀態篩選 |
| 訂單詳細 | `/member/orders/:orderNo` | `MemberOrderDetailView` | Member | 訂單明細、數位下載、申請退換貨 |
| 積點明細 | `/member/points` | `MemberPointsView` | Member | 積點餘額、明細列表 |
| 我的收藏 | `/member/wishlist` | `MemberWishlistView` | Member | 收藏商品列表 |

### 2.4 數位商品下載

| 頁面名稱 | Path | 元件 | 權限 | 說明 |
|---------|------|------|------|------|
| 下載頁 | `/downloads/:token` | `DownloadView` | Public | 驗證 Token 後觸發下載或顯示錯誤 |

---

## 3. 認證路由（AuthLayout）

| 頁面名稱 | Path | 元件 | 權限 | 說明 |
|---------|------|------|------|------|
| 登入 | `/login` | `LoginView` | Guest Only | 已登入自動導向 `/member` |
| 註冊 | `/register` | `RegisterView` | Guest Only | |
| 忘記密碼 | `/forgot-password` | `ForgotPasswordView` | Guest Only | 填寫 Email 寄送重設信 |
| 重設密碼 | `/reset-password` | `ResetPasswordView` | Guest Only | Query: `?token=xxx` |

---

## 4. 後台路由（AdminLayout）

### 4.1 後台入口

| 頁面名稱 | Path | 元件 | 權限 |
|---------|------|------|------|
| 後台登入 | `/admin/login` | `AdminLoginView` | Guest Only |
| 後台首頁 / 儀表板 | `/admin` | `AdminDashboardView` | Admin |

### 4.2 商品管理

| 頁面名稱 | Path | 元件 | 說明 |
|---------|------|------|------|
| 商品列表 | `/admin/products` | `AdminProductListView` | 搜尋、篩選、批次上下架 |
| 新增商品 | `/admin/products/create` | `AdminProductFormView` | 含多語系欄位、圖片上傳 |
| 編輯商品 | `/admin/products/:id/edit` | `AdminProductFormView` | 同上，帶入既有資料 |
| 分類管理 | `/admin/categories` | `AdminCategoryView` | 樹狀分類 CRUD |

### 4.3 訂單管理

| 頁面名稱 | Path | 元件 | 說明 |
|---------|------|------|------|
| 訂單列表 | `/admin/orders` | `AdminOrderListView` | 狀態、日期篩選、匯出按鈕 |
| 訂單詳細 | `/admin/orders/:orderNo` | `AdminOrderDetailView` | 狀態更新、物流單號登打 |

### 4.4 會員管理

| 頁面名稱 | Path | 元件 | 說明 |
|---------|------|------|------|
| 會員列表 | `/admin/members` | `AdminMemberListView` | 搜尋、匯出 CSV |
| 會員詳細 | `/admin/members/:id` | `AdminMemberDetailView` | 資料查看、停用、手動調整積點 |

### 4.5 促銷管理

| 頁面名稱 | Path | 元件 | 說明 |
|---------|------|------|------|
| 優惠券列表 | `/admin/coupons` | `AdminCouponListView` | |
| 新增 / 編輯優惠券 | `/admin/coupons/:id?/edit` | `AdminCouponFormView` | |

### 4.6 積點管理

| 頁面名稱 | Path | 元件 | 說明 |
|---------|------|------|------|
| 積點規則設定 | `/admin/points/rules` | `AdminPointRulesView` | 修改累點比例、兌換比例、有效期 |

### 4.7 報表

| 頁面名稱 | Path | 元件 | 說明 |
|---------|------|------|------|
| 銷售報表 | `/admin/reports/sales` | `AdminSalesReportView` | 日期區間篩選、圖表 + 匯出 Excel |
| 熱銷商品 | `/admin/reports/products` | `AdminProductReportView` | 排行榜 |
| 訂單趨勢 | `/admin/reports/orders` | `AdminOrderReportView` | 折線圖 |

### 4.8 系統設定

| 頁面名稱 | Path | 元件 | 說明 |
|---------|------|------|------|
| 管理員帳號管理 | `/admin/settings/admins` | `AdminAccountView` | 新增 / 停用管理員、角色設定 |

---

## 5. 導向規則（Navigation Guards）

| 情境 | 行為 |
|------|------|
| 未登入訪問 Member 頁面 | 導向 `/login`，登入後跳回原頁 |
| 已登入訪問 `/login`、`/register` | 自動導向 `/member` |
| 未登入直接進入 `/checkout` | 導向 `/login`，登入後跳回 `/checkout` |
| 非 Admin 訪問 `/admin/**` | 導向 `/admin/login` |
| 已登入 Admin 訪問 `/admin/login` | 導向 `/admin` |
| 頁面不存在 | 導向自訂 404 頁面 |

---

## 6. 頁面總數統計

| 類型 | 頁面數 |
|------|--------|
| 前台一般頁面 | 6 |
| 前台結帳流程 | 3 |
| 前台會員中心 | 7 |
| 數位下載 | 1 |
| 認證頁面 | 4 |
| 後台頁面 | 17 |
| **合計** | **38** |

---

*文件狀態：v1.0 Draft — 供前端開發參考*
