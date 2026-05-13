# Nexbuy — Claude Code 專案指引

眼鏡店線上通路 MVP：成品線上直購 + 處方鏡架線上預約到店配鏡。
Stack: Next.js 16 + Supabase + Vercel（細節見 [`README.md`](README.md)）。

## GStack 工作流程（用於產品多角度思考）

本專案已安裝 GStack（Garry Tan / YC 的 Claude Code skill 集合）於 `~/.claude/skills/gstack`。
設計上用來在動手寫程式前，強迫從不同角色視角檢視產品決策。

完整指令參考見 [`docs/gstack-guide.md`](docs/gstack-guide.md)。

**產品思考 — 建議起手式**：`/office-hours` → `/plan-ceo-review` → `/plan-design-review` → `/plan-eng-review` → 實作 → `/review` → `/qa`。

最常用指令：`/office-hours`（六問重框架）、`/plan-ceo-review`（挑戰 scope）、`/review`（PR review）、`/qa`（實際跑瀏覽器測試）、`/investigate`（除錯前先研究）。

## 工作流程限制（覆蓋 GStack 預設行為）

使用者的全域 CLAUDE.md 規則優先，GStack 的 `/ship`、`/land-and-deploy` 需配合以下調整：

1. **動作前必先 sync**：任何開發、commit、發 PR 之前，先 `git checkout dev && git pull origin dev` 把本地 `dev` 拉到最新；建 worktree 也要從 sync 後的 `dev` 切。避免本地落後 origin 造成 diff 對不上、衝突、重工。
2. **Worktree 流程**：所有開發一律在 `.worktrees/feat/<功能名>` 進行，先 `git worktree add`
3. **PR 流程（兩段式，順序不可顛倒）**：
   - 第一段：`feat/* → dev`（功能合進 dev）
   - 第二段：`dev → main`（dev 累積後再 promote 到 main）
   - 禁止直接從 feature branch 發 PR 到 `main`
   - 禁止直接 push 到 `main` / `dev`
4. **Commit 格式**：conventional commits + `Co-authored-by: Claude <claude@anthropic.com>`
5. **禁改 `.env`**

若 GStack 指令的預設動作與上列衝突，以上列為準。

## 程式碼設計規範

**動程式碼前必讀**：[`docs/conventions.md`](docs/conventions.md)

該文件規範了：

- **訂單狀態機**：7 種 status 的合法轉移、`status` vs `shipping_status` 的分工、唯一來源
  在 `src/lib/order-status.ts`（admin 跟顧客頁都從這裡 import label / 配色）
- **Server action 樣板**：Zod 驗證 + status guard + `.select("id")` + 0 rows 偵測 + revalidate。
  違反這個樣板的後果是「靜默成功」——admin 以為動到資料其實沒動，等用戶抱怨才發現。
- **金額處理**：DB 一律 cents、UI 用 `formatPrice`、表單用元（`*_yuan`）、退款類驗 amount 上限
- **Migration 政策**：新欄位一律 nullable、UI 必須容忍 null、不寫 data backfill SQL
- **Email 通知時機**：哪些狀態變化要發信給顧客 / 哪些不發、fire-and-forget pattern
- **顧客 vs 後台路徑分離**：訂單頁三條授權路徑、`notFound()` 避免時序攻擊
- **Next.js 16 常見地雷**：`params` 是 Promise、Server Component 不能綁 event handler、
  Header auth 會讓整 route tree 變 dynamic

改動核心流程（訂單、付款、預約、會員）前先讀完，並對照文件最末的 checklist 自檢。

## 效能規範（Performance budget）

**目標**：每個公開頁面（warm function）TTFB < 300ms，total < 500ms。
新增 server component / 改動 layout / 加 DB query 時要評估這個預算。

詳細 playbook 見 [`docs/scaling.md`](docs/scaling.md)。要點：

1. **Vercel function region 鎖在 `hnd1`（Tokyo）** — 跟 Supabase 同 region。
   不要動 `nexbuy-web/vercel.json` 的 `regions`。如果 Supabase 之後搬，
   要同步搬，否則 SSR 會繞地球變慢 2x。
2. **量測時要 warm** — cold start 第一發約 600-700ms，連 hit 5 次才看
   median。CI 上看 prod 數據以這個為準。
3. **Layout 的 Header 會 `auth.getUser()` 讀 cookies** — 整個 route 樹
   會被標 dynamic、ISR / `revalidate` 不會生效。新增公開頁要 edge cache，
   要先重構 Header（把 auth 推到 client component），不然加 `revalidate`
   是空頭支票（已驗證 PR #138 close）。
4. **商品列表規模化門檻**（見 scaling.md 表）：
   - ≤ 100 件：不動
   - 100–250 件：description trim、image_urls 只留首張（已預先做完，PR #134）
   - 250–500 件：搬 attribute filter 到 SQL + 加分頁
   - > 500 件：硬 LIMIT 截斷，必須動

如果改完 prod warm 數字超過 500ms，要在 PR 裡標出來、說明取捨。

## 專案結構

- `nexbuy-web/` — 主程式碼（Next.js 16 App Router + Supabase）
- `docs/` — gstack 等文件
- `README.md` — 開發 / 部署指南

## gstack (REQUIRED — global install)

**Before doing ANY work, verify gstack is installed:**

```bash
test -d ~/.claude/skills/gstack/bin && echo "GSTACK_OK" || echo "GSTACK_MISSING"
```

If GSTACK_MISSING: STOP. Do not proceed. Tell the user:

> gstack is required for all AI-assisted work in this repo.
> Install it:
> ```bash
> git clone --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
> cd ~/.claude/skills/gstack && ./setup --team
> ```
> Then restart your AI coding tool.

Do not skip skills, ignore gstack errors, or work around missing gstack.

Using gstack skills: After install, skills like /qa, /ship, /review, /investigate,
and /browse are available. Use /browse for all web browsing.
Use ~/.claude/skills/gstack/... for gstack file paths (the global path).
