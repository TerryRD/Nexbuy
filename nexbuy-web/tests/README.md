# Tests

Integration tests hitting a **local Supabase stack**. Tests delete data, so they
refuse to run against any URL that isn't `127.0.0.1` / `localhost`.

## 第一次跑

### 1. 開本機 Supabase

```bash
# 從 nexbuy-web/ 根目錄
supabase start
# 等 Docker pull + 啟動 (第一次 2-3 分鐘)
# 輸出會列出：API URL、anon key、service_role key
```

### 2. 填 `.env.test.local`

```bash
cp .env.test.example .env.test.local
# 把 supabase start 輸出的 service_role key 貼進去
# URL 預設就是 http://127.0.0.1:54321
```

### 3. 跑測試

```bash
pnpm test
# 或 watch mode
pnpm test:watch
# 或 UI
pnpm test:ui
```

## 測試覆蓋什麼

### `book-appointment.test.ts` — `book_appointment` RPC
- ✅ Happy path：slot 有 capacity → 建 appointment，booked_count +1
- ✅ Slot 滿 → `SLOT_FULL`
- ✅ Slot 被停用 (`is_active=false`) → `SLOT_FULL`
- ✅ Slot 日期已過 → `SLOT_FULL`
- ⚠️ **CRITICAL**：10 個同時預約 capacity=1 → 只 1 成功、9 SLOT_FULL
- ✅ 多人預約不超過 capacity

### `cancel-appointment.test.ts` — `cancel_appointment` RPC
- ✅ 取消 booked appointment → slot 釋放，下個人可預約
- ✅ Idempotent：取消兩次 OK，booked_count 不會爆負
- ✅ Invalid token → `INVALID_TOKEN`

## 什麼狀況下 Race Condition 測試會失敗

這是整個預約系統的防線測試。如果失敗，檢查：

1. **migration 的 SQL 邏輯改壞了**：`UPDATE appointment_slots SET booked_count = booked_count + 1 WHERE id = ? AND booked_count < capacity` 的 WHERE 必須原子，任何把條件拆出來用 SELECT + UPDATE 兩步的改動會破壞保證。
2. **pool 配置影響**：Supabase 預設 pool 夠用，但如果你改小到 1 connection，10 個平行 request 會序列執行，測試會通過但 race 沒驗到。保持 pool >= 5。
3. **測試環境污染**：`beforeEach` 沒清乾淨，上一個測試的 appointment 還在。確認 `resetAppointmentTables` 有跑。

## 要不要 mock Supabase？

**不要。** 這些測試的全部價值在於打真的 Postgres。用 mock 連 WHERE clause 都沒驗到，等於沒測。
如果你的 CI 不方便跑 Docker，改用 Testcontainers 或 Supabase 提供的 ephemeral test project。
