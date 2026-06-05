# Design Spec — Design Tokens 雙主題 + 共用 Layout

- 日期：2026-06-05
- 分支：`feat/design-tokens-layout`（基於 `origin/dev` 8e26e73）
- 範圍：精鋐眼鏡行 storefront 視覺重設計的**第一步**——落地設計交接包（`design_handoff_nexbuy_storefront/`）的 Design Tokens（Tailwind 4 `@theme` 雙主題）與共用 layout（Header / Footer / 底部 MobileNav / Tooltip 與全域基礎）。
- 來源：`design_handoff_nexbuy_storefront/README.md` + `src/styles.css`（色票/字體/圓角/陰影/斷點的權威來源）。
- 性質：對**既有 app** 的視覺重設計，不是新建站。設計稿 HTML/JSX 僅為視覺參考，不直接搬。

## 背景與既有狀態（以最新 `origin/dev` 為準）

現有 `nexbuy-web/` 已是成熟 app。**最新 dev 的 layout 現況**（比初次探索新，含 #185）：

- `globals.css`：shadcn 標準 token + 奶茶/拿鐵色系 + `.dark` class（next-themes）。**未被近期 commit 改動**。
- `layout.tsx`：字型 Geist + Geist_Mono + Fraunces；掛 `Header / main / Footer / CompareBar / CartSync / LineFab`，`ThemeProvider attribute="class"`。
- `Header.tsx`：`max-w-5xl`；左 = 漢堡 `MobileNavMenu` + Logo + wordmark；右 = 桌機 nav(眼鏡/試戴) + `HeaderAuthLink` + `CartLink` + 桌機 `ThemeToggle`。
- `Footer.tsx`：兩欄（品牌 + 聯絡），但**門市資訊是錯的佔位值**（台北市信義區 / (02) 0000-0000）。
- `MobileNavMenu.tsx`：漢堡下拉（`@base-ui/react` Menu），含 products/tryon + `ThemeToggleItem`。
- `ThemeToggle.tsx`：Button toggle，全尺寸可用（mobile 44×44 / desktop 28×28）。
- `ThemeToggleItem.tsx`：僅供 `MobileNavMenu` 用。
- `LineFab.tsx`：LINE 浮動鈕（固定定位）。
- `Logo.tsx`：browline 眼鏡線稿 SVG（currentColor）。

落差對照（現況 → 設計稿）：容器 1024→1320；Header 加公告列 + icon 動作(tooltip) + wordmark 金點；Footer 一/兩欄 → 四區塊 + 正確門市資訊；手機漢堡下拉 → **固定底部導覽列**；字型 Geist/Fraunces → Noto Serif/Sans TC + Cormorant + JetBrains Mono。

## 決策（已與使用者確認）

1. **Token 策略**：以 shadcn token 為**唯一來源**，覆寫其 OKLCH 值為設計稿色票；設計稿多出來的語義 token 以額外 `@theme` 變數新增。→ 既有 shadcn 元件零改動吃到新色。
2. **字型**：完整採用設計稿四種字型（`next/font/google`），移除 Geist/Fraunces。
3. **樣式方法**：翻譯成 shadcn 元件 + Tailwind utility；僅保留極少數共用原子（`.container`、`.eyebrow`）於 `globals.css`。
4. **主題機制**：維持 next-themes `.dark` class（不換 `data-theme`）。
5. **缺口路由**：為設計稿提到但不存在的頁面建 placeholder（避免 404）。
6. **Footer**：捨棄原型「重置示範資料」；門市資訊改用 README 權威值。
7. **桌機 nav**：選購 / 虛擬試戴 / 臉型測驗 / 門市。
8. **手機導覽**：照設計稿改成**固定底部導覽列**（首頁/選購/測驗/收藏/購物車），**移除**漢堡 `MobileNavMenu`；`ThemeToggle` 改在 Header 全尺寸顯示。
9. **RWD**：手機 / 平板 / 桌機三段皆須處理。

## A. Design Tokens（`src/app/globals.css`）

### A.1 shadcn token 值覆寫（`:root` 淺色 / `.dark` 深色）

色票來源 = 設計稿 `styles.css`。對應：

| 設計稿 | → shadcn token | 說明 |
|---|---|---|
| `--bg` | `--background` | 頁面底 |
| `--surface` | `--card`、`--popover` | 卡片底 |
| `--ink` | `--foreground`、`--card-foreground`、`--popover-foreground` | 主文字 |
| `--accent`（赤陶 `0.42 0.085 35`） | `--primary` | 主按鈕/價格/active |
| 奶油底 | `--primary-foreground` | primary 上文字 |
| `--surface-2` | `--secondary` | 次卡/hover |
| `--ink-soft` | `--secondary-foreground` | |
| `--surface-2`/淡底 | `--muted` | |
| `--muted`（`0.52 0.020 50`） | `--muted-foreground` | 輔助文字 |
| `--accent-soft`（`0.92 0.030 40`） | `--accent`（shadcn 淡底） | ⚠️ 命名衝突：shadcn `accent`=淡底、設計稿 `accent`=赤陶主色 → 赤陶歸 `--primary`、淡底歸 shadcn `--accent` |
| 赤陶/`--ink` | `--accent-foreground` | |
| `--line` | `--border`、`--input` | |
| `--accent`（赤陶） | `--ring` | 焦點環赤陶 |
| `--danger`（`0.50 0.15 25`） | `--destructive` | |

`chart-*` / `sidebar-*` 連動更新成新焦糖色系。

### A.2 新增語義 token

`:root`/`.dark` 定義 + `@theme inline` 曝光成 Tailwind 色（`text-gold`/`bg-surface-2`/`text-ink-soft`/`bg-bg-deep`/`text-success` 等）：
`--gold`、`--success`、`--warn`、`--bg-deep`、`--surface-2`、`--ink-soft`、`--accent-soft`、`--muted-2`、`--line-soft`。
（`--leaf` 設計稿有但 README 未列正式 token，暫不納入。）

### A.3 圓角 / 陰影 / 斷點

- **圓角**：`--r-sm:6 / --r-md:10 / --r-lg:16 / --r-xl:24`（必要時於 `@theme` 直接寫死四值，不用倍率推導）；shadcn `rounded-lg/md/sm` 對應。
- **陰影**：新增 `--shadow-1/2/3`（light 暖灰 / dark 近黑），`@theme` 曝光成可用工具類。
- **斷點**：新增 `nav: 900px`（桌機 nav ↔ 底部 nav 切換）；其餘沿用 Tailwind 預設並於元件對映設計稿 720/600/520 行為。

### A.4 全域基礎 / 小工具類

- `body` 預設 `font-sans`(Noto Sans TC) + `bg-background text-foreground`。
- `.container`：`w-full max-w-[1320px] mx-auto px-6 md:px-10 xl:px-14`（24/40/56px）。
- `.eyebrow`：mono + `text-[11px]` + `tracking-[0.18em]` + `uppercase` + `text-muted-foreground`。
- 字型 helper 用 Tailwind：`font-serif`(Noto Serif TC) / `font-display`(Cormorant italic) / `font-mono`(JetBrains Mono)。
- 保留既有 motion 工具（reveal / aurora / text-sheen）與 `prefers-reduced-motion`。
- 焦點環沿用 shadcn `outline-ring/50`（ring=赤陶）。

## B. 字型（`src/app/layout.tsx`）

`next/font/google`：`Noto_Serif_TC`→`--font-serif`、`Noto_Sans_TC`→`--font-sans`、`Cormorant_Garamond`(italic)→`--font-display`、`JetBrains_Mono`→`--font-mono`。`@theme` 對映同名 token。`display:"swap"`，中文 swap 期 fallback 系統字。移除 Geist/Geist_Mono/Fraunces 及其 `@theme` 對映。

> **效能取捨**：中文 webfont 偏重，恐影響 CLAUDE.md warm `<500ms`。緩解：`display:swap` + 系統字 fallback + 僅載必要字重。PR 量測 warm 並標出取捨。

## C. 共用 Layout 元件

### C.1 Header（`components/site/Header.tsx` 重設計）

- 維持 server component + `auth.getUser()`（已 dynamic，無新增 regression）。
- 結構：**公告列**（免運/營業訊息，純展示或可關）→ 主列（`.container`，1320）：左 wordmark `精鋐眼鏡行`+金點(`text-gold`，serif) + `Logo` SVG；中/右桌機 nav（`nav:` 以上顯示：選購/虛擬試戴/臉型測驗/門市）；右 icon 動作：比較 / 願望 / 購物車 / 主題切換，各 `aria-label`+Tooltip。
- 沿用 `CartLink`、`HeaderAuthLink`、`ThemeToggle`（全尺寸顯示）；願望入口 `/wishlist`、比較入口 `/compare`。
- **移除** `MobileNavMenu` import/使用。
- RWD：`<900px` 隱藏桌機 nav 文字連結（移至底部 MobileNav），保留 wordmark + icon（44×44 觸控）。

### C.2 Footer（`components/site/Footer.tsx` 重設計）

四區塊（桌機多欄 / 平板兩欄 / 手機單欄）：品牌簡介；分類連結（成品太陽眼鏡/處方鏡框/虛擬試戴/臉型測驗/鏡框比較）；服務（門市/願望清單/訂單查詢）；門市資訊（**README 權威值**：桃園市桃園區同德里中埔六街 95 號、(03) 317-3639、週一–六 15:00–22:00 週日休、Google Maps `https://maps.app.goo.gl/bqez4pyoFHN7oYE87`、統編 91234567）。底部版權列。**不含**「重置示範資料」。

### C.3 MobileNav（`components/site/MobileNav.tsx` 新元件，固定底部列）

- `<900px` 顯示的 `fixed bottom-0` 列（`bg-background/95 backdrop-blur` + 上邊框 + `shadow`）。
- 五項：首頁`/`、選購`/products`、測驗`/quiz`、收藏`/wishlist`、購物車`/cart`，Lucide 圖示 + 小字 label，active 用 primary（`usePathname` client component）。
- layout 在 `<900px` 為底部 nav 預留底距（`main`/body `pb`），內容不被遮。
- **LineFab 互動**：底部 nav 出現時，`LineFab` 在 `<900px` 上移避開（調整其 `bottom`/z-index），桌機不變。
- **移除** `MobileNavMenu.tsx` 與 `ThemeToggleItem.tsx`（改底部 nav 後孤兒）。

### C.4 Tooltip（Header icon 用）

- 優先用 `@base-ui/react` Tooltip（與既有 Menu 用法一致）；若該 subpath 不可用，退用設計稿 `[data-tip]` CSS 方案（globals.css 小工具，hover/focus 顯示）。實作時先驗證可用性。

### C.5 缺口路由 placeholder

建最小 placeholder（標題 + 「即將推出」，套新 layout）：`/quiz`、`/store`、`/wishlist`（頂層；既有 `/account/wishlist` 不動）。設計稿 `/try-on` **統一沿用既有 `/tryon`**，nav/footer 連 `/tryon`。

## D. RWD 策略

- **900px**（`nav`）：≥900 桌機 nav；<900 收起桌機 nav + 顯示底部 MobileNav（平板直向 768–900 走 <900 分支）。
- **720px**：`.container` padding 縮小（`md:px-10`→base `px-6`）。
- **600/520px**：本步確保 Header/Footer 窄寬不破版（wordmark 不被 icon 擠掉、Footer 單欄堆疊、底部 nav 五項均分）。
- 桌機 ≥1200：padding 56px。

## E. 檔案清單

| 檔案 | 動作 | 職責 |
|---|---|---|
| `src/app/globals.css` | 改 | token 覆寫 + 新語義 token + 圓角/陰影/斷點 + `.container`/`.eyebrow`（+ 視需要 `[data-tip]`） |
| `src/app/layout.tsx` | 改 | 換字型；新增底部 `MobileNav`；`main` 底距 |
| `src/components/site/Header.tsx` | 改 | 公告列 + wordmark 金點 + 桌機 nav + icon 動作(tooltip)；移除 MobileNavMenu |
| `src/components/site/Footer.tsx` | 改 | 四區塊 + 正確門市資訊 |
| `src/components/site/MobileNav.tsx` | 新 | 固定底部 nav |
| `src/components/site/MobileNavMenu.tsx` | 刪 | 漢堡下拉（被底部 nav 取代） |
| `src/components/site/ThemeToggleItem.tsx` | 刪 | 孤兒 |
| `src/components/site/LineFab.tsx` | 改 | `<900px` 上移避開底部 nav |
| `src/components/site/Logo.tsx` | 視需要 | 不變或微調 |
| `src/components/site/Tooltip*`（或 `components/ui/tooltip`） | 視驗證 | base-ui Tooltip 包裝 |
| `src/app/quiz/page.tsx`、`src/app/store/page.tsx`、`src/app/wishlist/page.tsx` | 新 | placeholder |

## F. 不在本範圍

實際頁面內容（首頁/列表/詳情/購物車/結帳/訂單/預約/測驗/試戴/比較/願望/門市/後台）依 README 順序留待後續 chunk；資料層/API 不動；placeholder 正式內容後補。

## G. 驗證

1. `pnpm typecheck`、`pnpm lint` 過。
2. `pnpm dev` 瀏覽器實測（gstack `/qa` 或 `/browse`）：
   - 淺/深兩主題（shadcn 元件吃到新色、wordmark 金點、陰影）。
   - 桌機（≥1200 / 900–1200）：nav + icon tooltip、Footer 多欄。
   - 平板（768–900）：桌機 nav 收起、底部 MobileNav 出現、Footer 兩欄、LineFab 不擋。
   - 手機（<600 / <520）：wordmark 不破版、底部 nav 五項、Footer 單欄、內容不被遮。
   - `:focus-visible` 焦點環；`prefers-reduced-motion`。
3. warm TTFB/total 量測（字型影響），對照 CLAUDE.md 預算，超標於 PR 標註。

## H. Git / 交付流程（依 CLAUDE.md）

- 已在 `.worktrees/feat/design-tokens-layout`（基於最新 `origin/dev`）開發。
- PR 兩段式：`feat/design-tokens-layout → dev`，再 `dev → main`。
- Conventional commits + `Co-authored-by: Claude <claude@anthropic.com>`；不改 `.env`。
