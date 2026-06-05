# 預約流程重設計（book + confirm）Plan

> REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Goal:** 重設計 `/appointment/book/[slug]`（3 步 Stepper：選擇時段/聯絡資訊/預約完成；14 天日期 + 30 分時段格 + 預約摘要 + inline 驗證）與 `/appointment/[token]`（確認卡 + 鏡框摘要[價+鏡片現場另計] + 門市資訊 + Google Maps 嵌入 + T-24h 提醒 + 取消）。**不動**：POST/DELETE `/api/appointments`、`book_appointment`/`cancel_appointment` RPC、token 授權、zod schema、slot 資料模型。

**前置：** worktree `.worktrees/feat/appointment-flow`（origin/dev）。先讀 conventions。Commit trailer `Co-authored-by: Claude <claude@anthropic.com>`。worktree 無 node_modules 先 `pnpm install --frozen-lockfile`。

## 現況（已 map）
- Book：`book/[slug]/page.tsx`(server，載 product[kind=prescription_frame] + available slots[booked_count<capacity，date>=today]) + `BookingForm.tsx`(client，單頁：slots 依日期分組 + 聯絡表單 + POST `/api/appointments` → success 顯示 cancel_url)。**無 Stepper**。
- Confirm：`[token]/page.tsx`(server，token regex `^[0-9a-f]{32}$` + admin client 查 appointment by cancel_token，join slot + frame) + `CancelForm.tsx`(client，DELETE `/api/appointments/[token]`)。狀態 booked/completed/noshow/cancelled。
- slot：`{id,date,start_time,end_time,capacity,booked_count,is_active}`。formatDate/formatTime 在 format.ts。Stepper 已存在（`steps/current`）。
- POST payload：`{slot_id,customer_name,customer_email,customer_phone,frame_product_id,note}` → 201 `{appointment_id,cancel_token,cancel_url}`；錯誤 409 SLOT_FULL/400 INVALID_INPUT。

## Task 1: 共用 StoreInfoCard
**File:** `src/components/site/StoreInfoCard.tsx`（新，server-safe）
門市資訊卡（可重用於 confirm + 未來 store 頁）：精鋐眼鏡行、地址 桃園市桃園區同德里中埔六街 95 號、電話 (03) 317-3639、營業 週一–六 15:00–22:00（週日公休）；Google Maps **iframe 嵌入**（`https://maps.google.com/maps?q=` + encodeURIComponent(地址) + `&output=embed&hl=zh-TW&z=17`）；深色模式套 filter（`dark:invert dark:hue-rotate-180`）；「在 Google 地圖開啟」link → `https://maps.app.goo.gl/bqez4pyoFHN7oYE87`（_blank rel noopener）。props 可選 `compact?`（confirm 用較精簡）。lucide MapPin/Phone/Clock。tokens 化。typecheck/lint 後 commit。

## Task 2: Booking 重設計（BookingForm.tsx，必要時 page.tsx）
- 加 client step state（`useState<0|1|2>`）+ `<Stepper steps={["選擇時段","聯絡資訊","預約完成"]} current={step} />`。
- **Step 0 選擇時段**：14 天日期選擇（由 available slots 取 distinct dates，最多 ~14；每日顯示剩餘時段數 / 額滿）→ 選日後顯示該日 30 分時段格（`formatTime(start)–formatTime(end)`，`booked_count>=capacity` disabled）。未選時段：inline 提示 + 「下一步」disabled；選了才能下一步。
- **Step 1 聯絡資訊**：表單（姓名/手機/Email/備註）+ **inline 驗證**（姓名必填、手機 `^0\d{8,9}$`、email 格式；`.err` mono text-destructive）+ 右側「預約摘要」卡（鏡框名 + 鏡框價 formatPrice + 選定時段 + 鏡片現場另計 note）。「上一步」回 Step 0；「送出預約」驗證通過才 POST。
- **Step 2 預約完成**：成功狀態（沿用既有 success：appointment_id + cancel_url，但重新排版）+ 「查看預約」link 到 cancel_url + 逛其他鏡框。
- **保留**：POST `/api/appointments` payload/錯誤處理（409/400）、回傳 cancel_url。product 需有 `price_cents`、`name`、`slug`（page.tsx 若未 select price_cents 要補；確認 product select 含 price_cents/name）。
- page.tsx 容器改 `.container`；其餘 server 載入邏輯保留。

## Task 3: Confirmation 重設計（[token]/page.tsx，必要時 CancelForm.tsx）
- 容器 `.container max-w-2xl`。確認卡（預約人/Email/鏡架/時段/狀態 badge）重排為 tokens 卡。
- **鏡框摘要**：鏡框名 + 鏡框價（需在 page.tsx 的 `frame:products(...)` select 補 `price_cents`）+ 「鏡片現場另計」說明。
- `<StoreInfoCard />`（含 Maps 嵌入）。
- **T-24h 提醒**：靜態說明卡「我們會在預約前 24 小時以 Email 提醒你」。
- **取消預約**：保留 `CancelForm`（DELETE 流程不動），booked 才顯示；cancelled/completed/noshow 顯示對應訊息（沿用既有條件）。
- **保留**：token regex 驗證、admin client 查詢（join slot+frame，補 price_cents）、狀態條件渲染、formatDate/formatTime。
- 狀態 badge：appointment 狀態（booked/completed/noshow/cancelled）label 沿用既有（無共用來源，local 即可）。

## 驗證
- typecheck/lint/build。
- 複製 .env.local，`pnpm start`：`/appointment/book/<一個處方鏡框 slug>` 200（先 curl `/products?kind=prescription_frame` 找 slug）→ 含 Stepper、時段、聯絡；confirmation 需真實 token，難 smoke → build/typecheck 為主。
- 視覺/多步/驗證/Maps/取消 → 使用者最後驗。

## Self-Review 對照
3步 Stepper✓ 14天日期+30分格(額滿disabled)✓ inline驗證✓ 預約摘要(價+鏡片另計)✓ 確認卡✓ 鏡框摘要✓ StoreInfoCard+Maps✓ T-24h✓ 取消保留✓ POST/DELETE/RPC/token 不動✓。
