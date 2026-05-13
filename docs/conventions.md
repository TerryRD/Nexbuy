# Nexbuy 程式碼設計規範

寫給未來在這個 repo 動程式碼的人（包含 Claude）。改動前先讀完這份，違反這裡的規則
通常會在 review 階段被擋下要求重寫，浪費來回時間。

工作流程規則在 [`/CLAUDE.md`](../CLAUDE.md)，效能規範在
[`docs/scaling.md`](scaling.md)。這份只談「程式碼怎麼寫」。

---

## 1. 訂單狀態機

**主路徑**：

```
pending_payment → paid → preparing → shipped → completed
```

**分支**：

- `cancelled`：**只能**從 `pending_payment` 進入（已付款想取消請走 `refunded`）
- `refunded`：可以從 `paid` / `preparing` / `shipped` / `completed` 進入

**唯一來源**：[`src/lib/order-status.ts`](../nexbuy-web/src/lib/order-status.ts)

- `ORDER_STATUSES`：readonly tuple，所有合法 status
- `ORDER_STATUS_LABEL`：中文 label
- `ORDER_STATUS_BADGE` / `ORDER_STATUS_BORDER` / `ORDER_STATUS_CHIP_ACTIVE`：UI 配色

**不要**在 page / component 內自己重複定義 status 對應 label / 配色。
顧客頁與 admin 頁都從這裡 import。違反這條的下場：改文案會漏改、改完上 prod
admin 跟顧客看到的字不一樣（已有前科）。

**`shipping_status` 跟 `status` 是獨立欄位**：

- `status`：訂單付款 / 結案狀態（7 種，見上）
- `shipping_status`：物流狀態（`not_shipped` / `preparing` / `shipped` / `delivered` / `returned`）
- 兩者**互相約束**但 DB 沒強制：admin 用 `advanceOrderStatus` 推進 `status`，
  `updateShipping` 推進 `shipping_status`。Server action 層要負責守規矩。

**已關閉訂單**（`cancelled` / `refunded`）一律不允許再變動：

- `updateShipping`、`refundOrder`、`advanceOrderStatus` 都加守衛
- UI 也要隱藏對應操作 form（雙重保險）

---

## 2. Server action 寫法

**樣板**：

```ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";

const fooSchema = z.object({ id: z.uuid(), /* ... */ });

export async function fooAction(formData: FormData): Promise<void> {
  // 1. 驗證輸入
  const parsed = fooSchema.safeParse({
    id: formData.get("id"),
    /* ... */
  });
  if (!parsed.success) throw new Error("INVALID_INPUT");

  // 2. 動 DB（帶 status guard + .select() 以驗 0 rows）
  const sb = await createServerSupabase();
  const { error, data } = await sb
    .from("orders")
    .update({ /* ... */ })
    .eq("id", parsed.data.id)
    .eq("status", "expected_from_state")   // ← status guard
    .select("id");                          // ← 必須帶，否則無法驗 0 rows

  if (error) {
    console.error("fooAction failed:", error);
    throw new Error("UPDATE_FAILED");
  }
  if (!data || data.length === 0) {
    // 「expected_from_state」guard 沒過 → 別人改了，throw 出去讓 Next.js 顯示錯誤
    throw new Error("STATE_CHANGED");
  }

  // 3. 重新驗證快取
  revalidatePath("/admin/orders");
}
```

**必須遵守**：

1. **一律 `zod.safeParse`**，不要 `parse`。失敗 throw `INVALID_INPUT`（HTTP 4xx 等價）。
2. **任何 state 變更必帶 `.select(...)`** — 否則無法分辨「動到 0 列」vs「動到 N 列」。
   靜默成功會讓 admin 以為動作有效，但實際沒改到任何東西（status guard 被觸發）。
3. **0 rows → `throw new Error("STATE_CHANGED")`**，不要 revalidate 後當作成功。
4. **status guard 使用三種寫法**：
   - 單一 from state：`.eq("status", "pending_payment")`
   - 多個 from state：`.in("status", ["a", "b"])`
   - 排除 closed states：`.not("status", "in", '("cancelled","refunded")')`
5. **錯誤 log 統一格式**：`console.error("<actionName> failed:", error)`。
6. **revalidate 在最後**，throw 之後**不要** revalidate。

**禁止**：

- ❌ 沒有 `.select()` 的 update — 等同沒有 0 rows 偵測
- ❌ catch error 後 silent return — 讓錯誤冒出來，Next.js 自有 error UI
- ❌ 在 server action 裡讀 cookie / 直接拿 `useState` 之類客戶端 API

---

## 3. 金額處理

**規則**：

- **DB 永遠存 cents**（integer 欄位，命名 `*_cents`，例：`total_cents`、`refund_amount_cents`、`shipping_fee_cents`）
- **顯示一律走 `formatPrice(cents)`**（`src/lib/format.ts`），自帶 NT$ 符號跟千分位
- **表單輸入用元（NT$）**，server action 自己 `* 100` 轉 cents
- **表單欄位命名 `_yuan` 結尾**：暗示這個值要乘 100 才能存進 `_cents` 欄位
  - 例：`refund_amount_yuan`（form 輸入）→ `refund_amount_cents = amount_yuan * 100`（DB）

**退款 / 折抵類動作**：

- **必須**驗 `amount <= total_cents`（不只是 `> 0`）
- **不能**只在 zod schema 內驗（zod 不知道 order 的 total），要先 fetch order 才驗

**為什麼**：JS Number 對小數有精度問題（`0.1 + 0.2 !== 0.3`）。金錢一律用 integer cents 避開。

---

## 4. Migration 政策

**規則**：

1. **新欄位一律 nullable**（不寫 `not null` 也不寫 `default`）：
   ```sql
   alter table orders
     add column if not exists refund_amount_cents integer,
     add column if not exists refund_method text;
   ```
   原因：舊資料補不到 default value；強制 not null 會讓 migration 失敗或要寫 backfill SQL。

2. **UI 必須容忍 null**：
   ```tsx
   // ❌ 錯：refunded_at 是新加的，舊資料是 null
   {row.status === "refunded" && row.refunded_at && <Block />}

   // ✅ 對：status 是真理來源，timestamp 沒值就跳過顯示
   {row.status === "refunded" && (
     <Block>
       {row.refunded_at && <p>{format(row.refunded_at)}</p>}
     </Block>
   )}
   ```
   違反這條的後果：migration 前的歷史訂單在 UI 上「看起來沒事」（block 直接不渲染），
   admin 不知道有舊資料漏處理。

3. **不寫 data backfill SQL**：讓 UI 處理。原因：
   - backfill 是 destructive operation，跑錯難回復
   - 歷史資料的 timestamp 沒辦法亂猜（要嘛真實，要嘛 null）

4. **檔名格式**：`YYYYMMDDHHMMSS_<short_desc>.sql`（時間戳必須單調遞增）。

5. **跑 migration**：
   - 本地：`supabase db push` 或 Supabase CLI 推送
   - Prod：用 Supabase Management API 或 dashboard SQL editor
   - **不要**在 server action / API route 裡跑 migration

---

## 5. Email 通知

**何時發信**：

| 狀態變化 | 發信 | 模板 |
|---|---|---|
| `pending_payment → paid` | ✅ | `orderPaidEmail` |
| `paid → shipped` | ✅ | `orderShippedEmail` |
| `* → refunded` | ✅ | `orderRefundedEmail`（待補） |
| `pending_payment → cancelled` | ✅ | `orderCancelledEmail`（待補） |
| `paid → preparing` / `shipped → completed` | ❌ | 中繼狀態，不打擾 |
| 新訂單建立 | ✅ → admin | `adminNewOrderEmail` |

**Fire-and-forget pattern**（不要 await，不要讓 email 失敗擋住主流程）：

```ts
import { sendEmail, isEmailConfigured } from "@/lib/email/send";
import { orderPaidEmail } from "@/lib/email/templates";

if (isEmailConfigured() && to.length > 0) {
  const content = orderPaidEmail({ /* ... */ });
  sendEmail({ to, ...content }).catch((err) => {
    console.error("[orders/admin] 寄信失敗:", err);
  });
} else {
  console.warn("[orders/admin] 未寄 email (缺 SMTP 設定 或 收件人)");
}
```

**模板**：放 `src/lib/email/templates.ts`，每個模板回傳 `{ subject, html, text }`。
**永遠帶 lookup_token**（`/orders/{order_no}?t={lookup_token}`），否則 guest
收件人點連結會 404。

---

## 6. 顧客 vs 後台分離

**路徑慣例**：

- 後台：`src/app/admin/(protected)/*` — middleware 守衛 admin role
- 顧客：根目錄 — `/products`、`/orders/[orderNo]` 等

**訂單授權三條路徑**（顧客頁要全部 implement）：

1. URL 帶有效 `lookup_token` → 任何人可看（給 guest 收信箱裡的連結）
2. 登入且 `orders.user_id = auth.uid()` → 不需 token
3. 登入且 `app_metadata.role === "admin"` → 不需 token

**三條都不通 → `notFound()`**（**不要** throw 401 / 403），避免時序攻擊洩漏
「這個 order_no 存在」的資訊。

---

## 7. 常見地雷

**Next.js 16 breaking changes**：

- `params` / `searchParams` 都是 `Promise`，必須 `await`：
  ```tsx
  export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
  }
  ```
- 直接讀型別會 type error。

**Server Component vs Client Component**：

- Server component **不能**綁 event handler（`onClick` / `onSubmit` / `onChange`）
  → build 失敗或 runtime 直接忽略
- 要 `confirm()` dialog 之類的互動，把該元件改成 `"use client"`
- Server action form 不需要 client component，但要 `confirm()` 確認就需要

**Header 會把整 route tree 變 dynamic**：

- `Header` 內呼叫 `sb.auth.getUser()` 讀 cookie → 整個 layout 樹都是 dynamic
- 加 `revalidate = 60` 也沒用（dynamic 蓋過 ISR）
- 要 edge cache 必須先把 auth 拆到 client component（見 [`docs/scaling.md`](scaling.md)）

**RLS 與 server-side queries**：

- `createServerSupabase()` 走使用者 session（受 RLS 限制）
- `createAdminSupabase()` 走 service role（**繞過** RLS，慎用）
- 顧客頁查訂單用 `createAdminSupabase()` + 三條授權路徑（見上）

---

## 8. 命名 / 風格小規則

- **檔案命名**：components 用 PascalCase（`OrderCard.tsx`），utils / actions 用 kebab-case（`shipping-status.ts`、`actions.ts`）
- **DB 欄位**：snake_case，全小寫（`refund_amount_cents`）
- **TS type / interface**：PascalCase（`OrderRow`、`ShippingStatus`）
- **Zod schema**：camelCase + `Schema` 結尾（`refundOrderSchema`）
- **Server action**：camelCase 動詞開頭（`cancelOrder`、`updateShipping`）
- **Error throw**：UPPER_SNAKE（`INVALID_INPUT`、`STATE_CHANGED`、`UPDATE_FAILED`、`NOT_FOUND`）

---

## 9. 改動前 checklist

開新 PR 動到核心流程（訂單、付款、預約、會員）前先確認：

- [ ] 讀過這份文件
- [ ] 涉及狀態變化：server action 有 status guard + `.select()` + 0 rows 偵測
- [ ] 涉及金額：用 cents 存、用 `formatPrice` 顯示、退款類驗 amount 上限
- [ ] 加新欄位：migration 用 nullable + UI 容忍 null
- [ ] 改 status label / 配色：只改 `src/lib/order-status.ts`，沒有自己另外定義
- [ ] 顧客體驗的狀態變化：有發 email 或在 backlog 排（不要默默吃掉）
- [ ] 公開頁 SSR：拉 prod 量 TTFB，超過 500ms 在 PR 寫清楚為什麼
