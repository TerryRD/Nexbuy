# 規模化策略 — 何時要動哪一塊

針對「資料變多會不會慢 / 壞」的具體 trigger 與對應動作。MVP 階段（< 50
件商品 / 月幾筆訂單）什麼都不用做；下面是當資料量觸發紅線時的 playbook。

---

## 效能預算（Performance budget）

**目標**：每個公開頁面（warm function）TTFB < 300ms、total < 500ms。

**Production 現況基準**（2026-05-06，11 個公開路徑都達標）：

| Path | TTFB | total |
|---|---|---|
| / | 260ms | 380ms |
| /products | 231ms | 387ms |
| /products?kind=finished | 267ms | 399ms |
| /products/[slug] | 254ms | 330ms |
| /appointment/book/[slug] | 260ms | 352ms |
| /login /signup /cart /compare | 220-250ms | 240-280ms |

新增 server component / 改 layout / 加 DB query 時要評估這個預算。改完
prod warm 數字超過 500ms 要在 PR 裡標出來。

### 三條已埋下、未來不要踩的坑

1. **Vercel function region 鎖在 `hnd1`（Tokyo）** — 跟 Supabase 同
   region。配置在 `nexbuy-web/vercel.json` 的 `regions: ["hnd1"]`。
   改去其他 region 之前要確認 Supabase 在哪 — 不同 region 的話 SSR
   每次都繞地球，TTFB 會多 200-400ms。實測（PR #136）：iad1 vs hnd1 對
   PDP total 差 813ms。
2. **量測前要 warm function** — cold start 第一發約 600-700ms，連 hit
   5 次取 median 才是真實值。CI / lighthouse 跑數據前要先 warm。
3. **Layout 的 Header 會 `auth.getUser()` 讀 cookies** — 這把整個 route
   標成 dynamic，`export const revalidate = N` / ISR 在公開頁不生效。
   實測（PR #138 close）：加 revalidate 後連 hit 8 次都 `x-vercel-cache:
   MISS`。如果未來真的要 edge cache 公開頁（例如 / 想 < 100ms TTFB），
   要先把 Header 重構為 client-side auth 才有意義。

---

## 商品列表 (`/products`)

**現況**：server fetch 全部 `is_online_available=true and deleted_at is
null` 的商品（最多 500 件，hard limit），全部 JSON 塞進 HTML、client
端用 `useMemo` 跑屬性篩選。

**為什麼這樣設計**：pill 切換（全部 / 成品 / 處方）+ 屬性篩選都是 0
roundtrip，瞬間反應 — 對 < 50 件商品的小店家體驗最好。

**紅線**：

| 商品數 | 症狀 | 對應 |
|---|---|---|
| ≤ 100 | OK | 不動 |
| 100–250 | HTML payload 100–250KB，行動 4G 慢半秒 | 加 `description` 截短到 100 字、`image_urls` 只保留首張 |
| 250–500 | LCP > 2.5s 危險、頁面切換有頓 | server-side filter（`?kind=&material=&page=`）+ 移除 client 全 fetch |
| > 500 | hard LIMIT 截斷，UI 跳警告 | 同上必做 |

**migration 腳本**（500 紅線時）：
1. `/products/page.tsx` 把 `kind` / `face_shape` / `frame_size` / `material`
   / `color` 全部下推到 SQL `where`
2. 加 `?page=N` URL param + `?per=24` page size
3. `ProductsList` 變 server-side render，attribute pill 改用 form GET
4. （可選）加全文搜尋：`tsvector` GIN index on `name + description + brand`，
   `?q=` 走 `to_tsquery`

---

## 訂單 (`/admin/orders`)

**現況**：抓最近 100 筆 `order by created_at desc`。報表頁抓最近 2000 筆。

**紅線**：

| 訂單累積 | 症狀 | 對應 |
|---|---|---|
| ≤ 1000 | OK，列表查詢 < 50ms | 不動 |
| 1000–10000 | 報表頁開始慢、SQL 掃越來越多 | reports 加日期範圍硬限制（最多 90 天） |
| > 10000 | admin 列表第二頁起爆量 | 導入 cursor pagination（id 為 cursor）|

DB 已有 `orders_created_at_idx` (#102 加的) — 上面這些都會走 index，所以只要
SQL 加 `LIMIT` 就好。

---

## 預約 (`/admin/appointments`)

**現況**：抓最近 200 筆 `order by created_at desc`。

**紅線**：1000 筆以上要分「即將到來」server query 跟「歷史」 lazy load。
DB 已有 `appointments_pending_reminder_idx`，partial index 把活躍預約的查詢
壓在 < 5ms。

---

## 行銷信收件人

**現況**：dispatch 時撈所有 `marketing_opt_in=true` customers，跑
`auth.admin.listUsers({ perPage: 1000 })` 拿 email。

**紅線**：

| 訂閱戶 | 症狀 | 對應 |
|---|---|---|
| ≤ 500 | OK | 不動 |
| 500–5000 | listUsers 多頁 + Resend free tier 100/day 撞牆 | 改 batch size 100 + delay |
| > 5000 | 真的要用 ESP（Mailgun / SES）| 換 transactional infra |

「每日 dispatch cap = 3 顆」(#100) 是當前安全閥。寄超過上限會被拒，明天再寄。

---

## 圖片

**現況**：商品圖走 Supabase Storage（free 1GB），下發走 `next/image` 走 Vercel
image transform（free tier 5000 張/月）。

**紅線**：

| 月圖片轉換 | 對應 |
|---|---|
| ≤ 5000 | OK | 
| 5000–25000 | Vercel Pro $20/月 解 | 
| > 25000 | 自建 Cloudflare Image Resizing | 

placeholder SVG 不算（已 `unoptimized`）。

---

## DB

**現況**：Supabase free tier 500MB DB + 2GB egress / 月。

**紅線**：

| 資料量 | 對應 |
|---|---|
| ≤ 100MB | OK | 
| 100–400MB | 開始監控；舊 audit log 歸檔 | 
| > 400MB | 升 Supabase Pro $25/月 OR 切歷史資料到冷儲 |

備份：Supabase free tier 沒有 daily backup；`pg_dump` 自動排程到 S3 是
production-ready 的最低標。要做。

---

## 觀察與監控

短期：Vercel Logs + Supabase Studio dashboard 已夠。

中期觸發點（到時要做）：
- LCP p75 > 2.5s 連續 3 天 → 開 Lighthouse audit + 加 RUM
- DB query > 100ms p95 → `pg_stat_statements` 撈 top 5 + 補 index
- Cron 連續失敗 2 次 → 加 Sentry / GlitchTip
