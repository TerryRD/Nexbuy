# Design Tokens 雙主題 + 共用 Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把設計交接包的 Design Tokens（雙主題）與共用 layout（Header / Footer / 底部 MobileNav / Tooltip + 全域基礎）落地到既有 Next.js 16 + Tailwind 4 + shadcn(base-nova) codebase。

**Architecture:** 以 shadcn 標準 token 為唯一來源，於 `globals.css` 覆寫其 OKLCH 值為設計稿暖奶油 + 赤陶色系，並新增無對應的語義 token（gold/success/warn/…）；字型改 `next/font` 載入 Noto Serif TC / Noto Sans TC / Cormorant Garamond / JetBrains Mono；Header/Footer/MobileNav 用 Tailwind utility + shadcn 元件重建；維持 next-themes `.dark` class。

**Tech Stack:** Next.js 16 (App Router, RSC)、Tailwind CSS 4 (`@theme`)、shadcn base-nova、`@base-ui/react`、next-themes、lucide-react、`next/font/google`。

**驗證方式（重要）：** 本 chunk 為設計 token + layout（CSS/視覺），主要以 `pnpm typecheck` + `pnpm lint` + `pnpm build` + **瀏覽器視覺驗證**（淺/深主題、三段 RWD、focus ring、reduced-motion）把關，非單元 TDD。每個 Task 結尾跑對應檢查 + commit。

**前置：** 已在 worktree `.worktrees/feat/design-tokens-layout`（基於 `origin/dev`）。所有指令在 `nexbuy-web/` 下執行。動 Next.js 前依 `nexbuy-web/AGENTS.md` 可查 `node_modules/next/dist/docs/`。

---

## 檔案結構

| 檔案 | 動作 | 責任 |
|---|---|---|
| `src/app/globals.css` | 改 | token 覆寫 + 新語義 token + 圓角/陰影/斷點 + `.container`/`.eyebrow` + `[data-tip]`(後備) |
| `src/app/layout.tsx` | 改 | next/font 四字型 + 掛變數；新增底部 `<MobileNav />` + `main` 底距 |
| `src/components/site/Header.tsx` | 改 | 公告列 + wordmark 金點 + 桌機 nav + icon 動作(tooltip)；移除 MobileNavMenu |
| `src/components/site/Footer.tsx` | 改 | 四區塊 + 正確門市資訊 |
| `src/components/site/MobileNav.tsx` | 新 | `<900px` 固定底部 nav（client，usePathname active） |
| `src/components/site/IconTip.tsx` | 新 | icon 按鈕 + tooltip 包裝（base-ui Tooltip 或 [data-tip] 後備） |
| `src/components/site/MobileNavMenu.tsx` | 刪 | 被底部 nav 取代 |
| `src/components/site/ThemeToggleItem.tsx` | 刪 | 孤兒 |
| `src/components/site/LineFab.tsx` | 改 | `<900px` 上移避開底部 nav |
| `src/app/quiz/page.tsx` | 新 | placeholder |
| `src/app/store/page.tsx` | 新 | placeholder |
| `src/app/wishlist/page.tsx` | 新 | placeholder |

斷點：新增 Tailwind 自訂斷點 `nav: 900px`（用法 `nav:flex` / `nav:hidden`），取代既有用 `sm:` 當作手機切換點的地方（桌機 nav 與底部 nav 的界線從 `sm`(640) 改為 `nav`(900)）。

---

## Task 1: Design Tokens 覆寫（globals.css 色票 + 字型 + 圓角/陰影/斷點）

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: 改 `@theme inline` 的字型、圓角，新增語義色與斷點**

把 `@theme inline { ... }` 內的三行字型替換，圓角四行改寫死值，並在區塊內新增語義色 token 與斷點。

替換這三行：
```css
  --font-sans: var(--font-sans);
  --font-mono: var(--font-geist-mono);
  --font-heading: var(--font-fraunces);
```
改成：
```css
  --font-sans: var(--font-noto-sans-tc), "PingFang TC", "Microsoft JhengHei", system-ui, sans-serif;
  --font-serif: var(--font-noto-serif-tc), "Songti TC", "PingFang TC", serif;
  --font-display: var(--font-cormorant), var(--font-noto-serif-tc), serif;
  --font-mono: var(--font-jetbrains-mono), ui-monospace, "SFMono-Regular", monospace;
  --font-heading: var(--font-noto-serif-tc), "Songti TC", serif;
```

把這四行：
```css
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
```
改成設計稿值（其餘 2xl/3xl/4xl 保留）：
```css
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;
```

在 `@theme inline { ... }` 結尾 `}` 前，新增語義色、陰影、斷點：
```css
  /* extra semantic colors (no shadcn equivalent) */
  --color-gold: var(--gold);
  --color-success: var(--success);
  --color-warn: var(--warn);
  --color-bg-deep: var(--bg-deep);
  --color-surface-2: var(--surface-2);
  --color-ink-soft: var(--ink-soft);
  --color-muted-2: var(--muted-2);
  --color-line-soft: var(--line-soft);
  /* editorial shadows */
  --shadow-1: var(--shadow-1);
  --shadow-2: var(--shadow-2);
  --shadow-3: var(--shadow-3);
  /* 900px = desktop nav <-> bottom mobile nav switch */
  --breakpoint-nav: 900px;
```

- [ ] **Step 2: 覆寫 `:root`（淺色）為設計稿暖奶油色系 + 新增語義 token**

整段替換現有 `:root { ... }`（保留 `--radius`，值改 `1rem`）：
```css
:root {
  --background: oklch(0.967 0.013 75);
  --foreground: oklch(0.205 0.024 45);
  --card: oklch(0.985 0.008 78);
  --card-foreground: oklch(0.205 0.024 45);
  --popover: oklch(0.985 0.008 78);
  --popover-foreground: oklch(0.205 0.024 45);
  --primary: oklch(0.42 0.085 35);
  --primary-foreground: oklch(0.985 0.008 78);
  --secondary: oklch(0.955 0.014 72);
  --secondary-foreground: oklch(0.35 0.022 45);
  --muted: oklch(0.955 0.014 72);
  --muted-foreground: oklch(0.52 0.020 50);
  --accent: oklch(0.92 0.030 40);
  --accent-foreground: oklch(0.42 0.085 35);
  --destructive: oklch(0.50 0.15 25);
  --border: oklch(0.85 0.012 65);
  --input: oklch(0.85 0.012 65);
  --ring: oklch(0.42 0.085 35);
  --chart-1: oklch(0.42 0.085 35);
  --chart-2: oklch(0.66 0.080 75);
  --chart-3: oklch(0.52 0.020 50);
  --chart-4: oklch(0.55 0.08 145);
  --chart-5: oklch(0.35 0.022 45);
  --radius: 1rem;
  --sidebar: oklch(0.985 0.008 78);
  --sidebar-foreground: oklch(0.205 0.024 45);
  --sidebar-primary: oklch(0.42 0.085 35);
  --sidebar-primary-foreground: oklch(0.985 0.008 78);
  --sidebar-accent: oklch(0.92 0.030 40);
  --sidebar-accent-foreground: oklch(0.42 0.085 35);
  --sidebar-border: oklch(0.85 0.012 65);
  --sidebar-ring: oklch(0.42 0.085 35);

  /* extra semantic tokens */
  --gold: oklch(0.66 0.080 75);
  --success: oklch(0.55 0.08 145);
  --warn: oklch(0.65 0.13 60);
  --bg-deep: oklch(0.945 0.018 70);
  --surface-2: oklch(0.955 0.014 72);
  --ink-soft: oklch(0.35 0.022 45);
  --muted-2: oklch(0.70 0.015 60);
  --line-soft: oklch(0.90 0.010 70);

  --shadow-1: 0 1px 2px oklch(0.20 0.02 45 / 0.04), 0 1px 1px oklch(0.20 0.02 45 / 0.03);
  --shadow-2: 0 6px 20px -8px oklch(0.20 0.02 45 / 0.12), 0 2px 4px oklch(0.20 0.02 45 / 0.04);
  --shadow-3: 0 24px 60px -20px oklch(0.20 0.02 45 / 0.18), 0 6px 12px oklch(0.20 0.02 45 / 0.06);
}
```

- [ ] **Step 3: 覆寫 `.dark`（深色）**

整段替換現有 `.dark { ... }`：
```css
.dark {
  --background: oklch(0.175 0.014 45);
  --foreground: oklch(0.955 0.010 75);
  --card: oklch(0.215 0.014 45);
  --card-foreground: oklch(0.955 0.010 75);
  --popover: oklch(0.215 0.014 45);
  --popover-foreground: oklch(0.955 0.010 75);
  --primary: oklch(0.72 0.10 35);
  --primary-foreground: oklch(0.175 0.014 45);
  --secondary: oklch(0.245 0.013 50);
  --secondary-foreground: oklch(0.85 0.012 70);
  --muted: oklch(0.245 0.013 50);
  --muted-foreground: oklch(0.66 0.018 65);
  --accent: oklch(0.30 0.04 40);
  --accent-foreground: oklch(0.955 0.010 75);
  --destructive: oklch(0.66 0.20 25);
  --border: oklch(0.32 0.012 50);
  --input: oklch(0.32 0.012 50);
  --ring: oklch(0.72 0.10 35);
  --chart-1: oklch(0.72 0.10 35);
  --chart-2: oklch(0.78 0.10 80);
  --chart-3: oklch(0.66 0.018 65);
  --chart-4: oklch(0.55 0.08 145);
  --chart-5: oklch(0.85 0.012 70);
  --sidebar: oklch(0.215 0.014 45);
  --sidebar-foreground: oklch(0.955 0.010 75);
  --sidebar-primary: oklch(0.72 0.10 35);
  --sidebar-primary-foreground: oklch(0.175 0.014 45);
  --sidebar-accent: oklch(0.30 0.04 40);
  --sidebar-accent-foreground: oklch(0.955 0.010 75);
  --sidebar-border: oklch(0.32 0.012 50);
  --sidebar-ring: oklch(0.72 0.10 35);

  --gold: oklch(0.78 0.10 80);
  --success: oklch(0.55 0.08 145);
  --warn: oklch(0.65 0.13 60);
  --bg-deep: oklch(0.15 0.015 40);
  --surface-2: oklch(0.245 0.013 50);
  --ink-soft: oklch(0.85 0.012 70);
  --muted-2: oklch(0.50 0.016 55);
  --line-soft: oklch(0.27 0.012 50);

  --shadow-1: 0 1px 2px oklch(0 0 0 / 0.4);
  --shadow-2: 0 6px 20px -8px oklch(0 0 0 / 0.5);
  --shadow-3: 0 24px 60px -20px oklch(0 0 0 / 0.65);
}
```

- [ ] **Step 4: 在 `@layer base` 加 `.container`/`.eyebrow` 與 `[data-tip]` 後備工具**

在 `@layer base { ... }` 之後新增一個 `@layer components`（放現有 motion utilities 之前）：
```css
@layer components {
  .container {
    width: 100%;
    max-width: 1320px;
    margin-inline: auto;
    padding-inline: 1.5rem;
  }
  @media (min-width: 768px) { .container { padding-inline: 2.5rem; } }
  @media (min-width: 1200px) { .container { padding-inline: 3.5rem; } }

  .eyebrow {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--muted-foreground);
  }

  /* CSS tooltip fallback for icon buttons: <button data-tip="比較"> */
  [data-tip] { position: relative; }
  [data-tip]::after {
    content: attr(data-tip);
    position: absolute;
    top: calc(100% + 6px);
    left: 50%;
    translate: -50% 0;
    padding: 4px 8px;
    border-radius: var(--radius-sm);
    background: var(--popover);
    color: var(--popover-foreground);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-2);
    font-size: 11px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s ease;
    z-index: 60;
  }
  [data-tip]:hover::after,
  [data-tip]:focus-visible::after { opacity: 1; }
  @media (prefers-reduced-motion: reduce) {
    [data-tip]::after { transition: none; }
  }
}
```

> 注意：Tailwind 的 `container` utility 可能與此 `.container` class 衝突。本 codebase 既有 layout 多用 `mx-auto max-w-5xl`，不靠 Tailwind `container`。若 build 警告類名衝突，改用 `.site-container` 命名並同步元件。

- [ ] **Step 5: typecheck + lint + build**

Run:
```bash
pnpm typecheck && pnpm lint
```
Expected: 皆 PASS（globals.css 不影響 TS，但確認沒誤動其他檔）。CSS 變更下一個 Task 換字型後一起 build。

- [ ] **Step 6: Commit**
```bash
git add src/app/globals.css
git commit -m "feat(theme): override shadcn tokens with handoff cream/terracotta palette + semantic tokens

Co-authored-by: Claude <claude@anthropic.com>"
```

---

## Task 2: 字型切換（next/font 四字型）

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: 替換字型 import 與宣告**

把頂部：
```ts
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
```
改成：
```ts
import {
  Noto_Sans_TC,
  Noto_Serif_TC,
  Cormorant_Garamond,
  JetBrains_Mono,
} from "next/font/google";
```

把現有三個字型宣告（`geistSans` / `geistMono` / `fraunces`）整段替換為：
```ts
// 內文 / UI
const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

// 中文標題 / 商品名
const notoSerifTC = Noto_Serif_TC({
  variable: "--font-noto-serif-tc",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

// 英文 display（價格、斜體標語、編號）
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["italic", "normal"],
  display: "swap",
});

// 編號 / 規格 mm / eyebrow
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});
```

> 註：Noto Serif/Sans TC 為中文字，`next/font/google` 僅有 `latin` subset 可宣告；中文字符走完整檔，`display:swap` 期間 fallback 系統字（PingFang TC 等）。

- [ ] **Step 2: 更新 `<html>` className 的字型變數**

把：
```tsx
className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
```
改成：
```tsx
className={`${notoSansTC.variable} ${notoSerifTC.variable} ${cormorant.variable} ${jetbrainsMono.variable} h-full antialiased`}
```

- [ ] **Step 3: build 驗證字型生效**

Run:
```bash
pnpm build
```
Expected: build PASS（next/font 解析四字型無誤）。若報未知字型名，核對 Google Fonts 套件名拼寫（`Noto_Sans_TC` 等）。

- [ ] **Step 4: Commit**
```bash
git add src/app/layout.tsx
git commit -m "feat(theme): switch to Noto Serif/Sans TC + Cormorant + JetBrains Mono via next/font

Co-authored-by: Claude <claude@anthropic.com>"
```

---

## Task 3: IconTip 元件（icon 按鈕 tooltip）

先驗證 `@base-ui/react` 是否提供 Tooltip；不可用則退 `[data-tip]`（Task 1 已備 CSS）。

**Files:**
- Create: `src/components/site/IconTip.tsx`

- [ ] **Step 1: 驗證 base-ui Tooltip 是否存在**

Run:
```bash
node -e "require.resolve('@base-ui/react/tooltip'); console.log('TOOLTIP_OK')" 2>/dev/null || echo "TOOLTIP_MISSING"
```
Expected: 印出 `TOOLTIP_OK` 或 `TOOLTIP_MISSING`，決定下一步。

- [ ] **Step 2a:（若 TOOLTIP_OK）用 base-ui Tooltip 建 IconTip**

Create `src/components/site/IconTip.tsx`：
```tsx
"use client";

import * as React from "react";
import { Tooltip } from "@base-ui/react/tooltip";
import Link from "next/link";

type IconTipProps = {
  tip: string;
  href?: string;
  ariaLabel?: string;
  className?: string;
  children: React.ReactNode;
};

/** Icon action button/link with an accessible tooltip on hover/focus. */
export function IconTip({ tip, href, ariaLabel, className, children }: IconTipProps) {
  const base =
    "inline-flex min-h-11 min-w-11 nav:min-h-9 nav:min-w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";
  const inner = href ? (
    <Link href={href} aria-label={ariaLabel ?? tip} className={`${base} ${className ?? ""}`}>
      {children}
    </Link>
  ) : (
    <button type="button" aria-label={ariaLabel ?? tip} className={`${base} ${className ?? ""}`}>
      {children}
    </button>
  );

  return (
    <Tooltip.Root>
      <Tooltip.Trigger render={inner} />
      <Tooltip.Portal>
        <Tooltip.Positioner side="bottom" sideOffset={6} className="z-[60]">
          <Tooltip.Popup className="rounded-sm border bg-popover px-2 py-1 text-[11px] text-popover-foreground shadow-2">
            {tip}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
```
> 若 base-ui Tooltip API 與此不符，依 `node_modules/@base-ui/react` 實際匯出調整（參考既有 `MobileNavMenu.tsx` 的 `@base-ui/react/menu` 用法風格）。需要 `Tooltip.Provider` 時，於 `layout.tsx` 包一層。

- [ ] **Step 2b:（若 TOOLTIP_MISSING）用 [data-tip] CSS 後備建 IconTip**

Create `src/components/site/IconTip.tsx`：
```tsx
import * as React from "react";
import Link from "next/link";

type IconTipProps = {
  tip: string;
  href?: string;
  ariaLabel?: string;
  className?: string;
  children: React.ReactNode;
};

/** Icon action with CSS [data-tip] tooltip (see globals.css). */
export function IconTip({ tip, href, ariaLabel, className, children }: IconTipProps) {
  const base =
    "inline-flex min-h-11 min-w-11 nav:min-h-9 nav:min-w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";
  const cls = `${base} ${className ?? ""}`;
  return href ? (
    <Link href={href} aria-label={ariaLabel ?? tip} data-tip={tip} className={cls}>
      {children}
    </Link>
  ) : (
    <button type="button" aria-label={ariaLabel ?? tip} data-tip={tip} className={cls}>
      {children}
    </button>
  );
}
```

- [ ] **Step 3: typecheck**

Run: `pnpm typecheck`
Expected: PASS。

- [ ] **Step 4: Commit**
```bash
git add src/components/site/IconTip.tsx
git commit -m "feat(site): add IconTip (tooltip icon action) component

Co-authored-by: Claude <claude@anthropic.com>"
```

---

## Task 4: 底部 MobileNav + 移除漢堡選單

**Files:**
- Create: `src/components/site/MobileNav.tsx`
- Delete: `src/components/site/MobileNavMenu.tsx`, `src/components/site/ThemeToggleItem.tsx`

- [ ] **Step 1: 建 MobileNav（固定底部，`<900px` 顯示）**

Create `src/components/site/MobileNav.tsx`：
```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Glasses, Sparkles, Heart, ShoppingBag } from "lucide-react";

const ITEMS = [
  { href: "/", label: "首頁", icon: Home },
  { href: "/products", label: "選購", icon: Glasses },
  { href: "/quiz", label: "測驗", icon: Sparkles },
  { href: "/wishlist", label: "收藏", icon: Heart },
  { href: "/cart", label: "購物車", icon: ShoppingBag },
];

/** Fixed bottom navigation, mobile/tablet only (<900px). */
export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="主導覽"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur nav:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-5" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 2: 刪除孤兒檔**

Run:
```bash
git rm src/components/site/MobileNavMenu.tsx src/components/site/ThemeToggleItem.tsx
```
Expected: 兩檔移除。

- [ ] **Step 3: typecheck（會因 Header 仍 import MobileNavMenu 而失敗，Task 5 修）**

Run: `pnpm typecheck`
Expected: 暫時 FAIL（`Header.tsx` 找不到 `./MobileNavMenu`）— 預期，Task 5 移除該 import 後恢復。**本 Task 先不 commit**，與 Task 5 合併驗證。

> 為保持每 commit 可編譯：Task 4 + Task 5 視為一組，於 Task 5 結尾一起 commit。

---

## Task 5: Header 重設計（公告列 + wordmark 金點 + nav + icon 動作）

**Files:**
- Modify: `src/components/site/Header.tsx`

- [ ] **Step 1: 整檔重寫 Header**

Replace `src/components/site/Header.tsx` 全部內容：
```tsx
import Link from "next/link";
import { Glasses, Camera, Sparkles, MapPin, GitCompareArrows, Heart } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import { CartLink } from "./CartLink";
import { HeaderAuthLink } from "./HeaderAuthLink";
import { IconTip } from "./IconTip";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "/products", label: "選購", icon: Glasses },
  { href: "/tryon", label: "虛擬試戴", icon: Camera },
  { href: "/quiz", label: "臉型測驗", icon: Sparkles },
  { href: "/store", label: "門市", icon: MapPin },
];

export async function Header() {
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm">
      {/* Announcement bar */}
      <div className="bg-bg-deep text-muted-foreground">
        <p className="container flex h-8 items-center justify-center gap-2 text-center text-[11px] tracking-wide">
          <span>滿 NT$3,000 免運</span>
          <span aria-hidden className="text-line-soft">·</span>
          <span>週一–六 15:00–22:00</span>
        </p>
      </div>

      {/* Main bar */}
      <div className="container flex h-16 items-center justify-between gap-2">
        {/* Brand */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 whitespace-nowrap font-serif text-lg font-medium tracking-tight text-foreground sm:text-xl"
        >
          <Logo className="h-5 w-auto text-foreground" />
          <span>
            精鋐眼鏡行<span className="text-gold">.</span>
          </span>
        </Link>

        {/* Desktop nav (>=900px) */}
        <nav className="hidden items-center gap-1 nav:flex" aria-label="主導覽">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Icon actions */}
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <IconTip tip="鏡框比較" href="/compare">
            <GitCompareArrows className="size-4" />
          </IconTip>
          <IconTip tip="願望清單" href="/wishlist">
            <Heart className="size-4" />
          </IconTip>
          <HeaderAuthLink loggedIn={!!user} />
          <CartLink />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
```

> `GitCompareArrows` 為 lucide-react 對應「git-compare」的圖示名；若該版本無此名，改用 `GitCompare`。Step 2 typecheck 會抓到。

- [ ] **Step 2: typecheck + lint（Task 4+5 合併驗證）**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS。若 lucide 圖示名錯誤（`GitCompareArrows`/`Sparkles` 等），依錯誤訊息換正確名（查 `node_modules/lucide-react`）。

- [ ] **Step 3: Commit（Task 4 + Task 5）**
```bash
git add src/components/site/Header.tsx src/components/site/MobileNav.tsx
git commit -m "feat(site): redesign Header (announcement bar, wordmark, nav, icon tooltips) + bottom MobileNav

- replace mobile hamburger menu with fixed bottom nav (<900px)
- remove MobileNavMenu + ThemeToggleItem
- ThemeToggle now visible at all sizes

Co-authored-by: Claude <claude@anthropic.com>"
```

---

## Task 6: Footer 重設計（四區塊 + 正確門市資訊）

**Files:**
- Modify: `src/components/site/Footer.tsx`

- [ ] **Step 1: 整檔重寫 Footer**

Replace `src/components/site/Footer.tsx` 全部內容：
```tsx
import Link from "next/link";
import { Phone, MapPin, Clock } from "lucide-react";
import { Logo } from "./Logo";

const SHOP = {
  name: "精鋐眼鏡行",
  address: "桃園市桃園區同德里中埔六街 95 號",
  phone: "(03) 317-3639",
  phoneLink: "tel:+886333173639",
  hours: "週一–週六 15:00–22:00（週日公休）",
  maps: "https://maps.app.goo.gl/bqez4pyoFHN7oYE87",
  taxId: "91234567",
};

const CATEGORIES = [
  { href: "/products?kind=finished", label: "成品太陽眼鏡" },
  { href: "/products?kind=prescription_frame", label: "處方鏡框" },
  { href: "/tryon", label: "虛擬試戴" },
  { href: "/quiz", label: "臉型測驗" },
  { href: "/compare", label: "鏡框比較" },
];

const SERVICES = [
  { href: "/store", label: "門市資訊" },
  { href: "/wishlist", label: "願望清單" },
  { href: "/orders", label: "訂單查詢" },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-bg-deep">
      <div className="container py-12">
        <div className="grid gap-10 sm:grid-cols-2 nav:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2 font-serif text-lg font-medium text-foreground">
              <Logo className="h-5 w-auto text-foreground" />
              <span>精鋐眼鏡行<span className="text-gold">.</span></span>
            </Link>
            <p className="text-sm text-muted-foreground">
              在家挑框，到店配鏡。慢工細活，實體店家親手服務。
            </p>
          </div>

          {/* Categories */}
          <nav className="space-y-3 text-sm" aria-label="商品分類">
            <h3 className="eyebrow">選購</h3>
            <ul className="space-y-2 text-muted-foreground">
              {CATEGORIES.map((c) => (
                <li key={c.href}>
                  <Link href={c.href} className="transition-colors hover:text-foreground">
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Services */}
          <nav className="space-y-3 text-sm" aria-label="服務">
            <h3 className="eyebrow">服務</h3>
            <ul className="space-y-2 text-muted-foreground">
              {SERVICES.map((s) => (
                <li key={s.href}>
                  <Link href={s.href} className="transition-colors hover:text-foreground">
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Store info */}
          <div className="space-y-3 text-sm">
            <h3 className="eyebrow">門市</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                <a href={SHOP.maps} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">
                  {SHOP.address}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 size-4 shrink-0" />
                <a href={SHOP.phoneLink} className="transition-colors hover:text-foreground">
                  {SHOP.phone}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="mt-0.5 size-4 shrink-0" />
                <span>{SHOP.hours}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-1 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} {SHOP.name} ・ 統一編號 {SHOP.taxId}</span>
          <span>在家挑框，到店配鏡</span>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS。

- [ ] **Step 3: Commit**
```bash
git add src/components/site/Footer.tsx
git commit -m "feat(site): redesign Footer with 4 sections + correct shop info

Co-authored-by: Claude <claude@anthropic.com>"
```

---

## Task 7: layout 掛 MobileNav + main 底距 + LineFab 避讓

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/components/site/LineFab.tsx`

- [ ] **Step 1: layout 引入並掛載 MobileNav，main 加底距**

在 `src/app/layout.tsx` import 區加：
```tsx
import { MobileNav } from "@/components/site/MobileNav";
```
把：
```tsx
          <main className="flex-1">{children}</main>
```
改成（`<900px` 預留底部 nav 高度，避免內容被遮）：
```tsx
          <main className="flex-1 pb-14 nav:pb-0">{children}</main>
```
在 `<Footer />` 之後、`<LineFab />` 之前（或任意位置，固定定位）加：
```tsx
          <MobileNav />
```

- [ ] **Step 2: LineFab 在 `<900px` 上移避開底部 nav**

Read `src/components/site/LineFab.tsx`，找到其固定定位 class（如 `fixed bottom-4 right-4` 或類似）。把 `bottom-*` 改為手機抬高、桌機原值，例如：
```text
bottom-20 nav:bottom-6
```
（即 `<900px` 時 `bottom-20`≈5rem 高過 56px 底部 nav；`>=900px` 回 `bottom-6`。依該檔實際既有值微調，確保 z-index 不低於 nav 的 `z-40`。）

- [ ] **Step 3: build**

Run: `pnpm build`
Expected: PASS。

- [ ] **Step 4: Commit**
```bash
git add src/app/layout.tsx src/components/site/LineFab.tsx
git commit -m "feat(site): mount bottom MobileNav, add main bottom padding, lift LineFab above it

Co-authored-by: Claude <claude@anthropic.com>"
```

---

## Task 8: 缺口路由 placeholder（/quiz /store /wishlist）

**Files:**
- Create: `src/app/quiz/page.tsx`
- Create: `src/app/store/page.tsx`
- Create: `src/app/wishlist/page.tsx`

- [ ] **Step 1: 建三個 placeholder 頁**

每頁套新 layout 容器與字型。三檔內容（替換 `<TITLE>`/`<DESC>`）：

`src/app/quiz/page.tsx`:
```tsx
import type { Metadata } from "next";

export const metadata: Metadata = { title: "臉型測驗" };

export default function QuizPage() {
  return (
    <div className="container py-20 text-center">
      <p className="eyebrow mb-3">FACE SHAPE QUIZ</p>
      <h1 className="font-serif text-3xl font-medium">臉型測驗</h1>
      <p className="mt-4 text-muted-foreground">即將推出 — 找出最適合你的鏡框。</p>
    </div>
  );
}
```

`src/app/store/page.tsx`:
```tsx
import type { Metadata } from "next";

export const metadata: Metadata = { title: "門市資訊" };

export default function StorePage() {
  return (
    <div className="container py-20 text-center">
      <p className="eyebrow mb-3">OUR STORE</p>
      <h1 className="font-serif text-3xl font-medium">門市資訊</h1>
      <p className="mt-4 text-muted-foreground">即將推出 — 桃園市桃園區同德里中埔六街 95 號。</p>
    </div>
  );
}
```

`src/app/wishlist/page.tsx`:
```tsx
import type { Metadata } from "next";

export const metadata: Metadata = { title: "願望清單" };

export default function WishlistPage() {
  return (
    <div className="container py-20 text-center">
      <p className="eyebrow mb-3">WISHLIST</p>
      <h1 className="font-serif text-3xl font-medium">願望清單</h1>
      <p className="mt-4 text-muted-foreground">即將推出 — 你收藏的鏡框會出現在這裡。</p>
    </div>
  );
}
```

> 確認 `src/app/quiz`、`src/app/store`、`src/app/wishlist` 目前不存在（避免覆蓋）。`/wishlist` 與既有 `/account/wishlist` 並存、互不影響。

- [ ] **Step 2: build**

Run: `pnpm build`
Expected: PASS，三條新路由出現在路由表。

- [ ] **Step 3: Commit**
```bash
git add src/app/quiz/page.tsx src/app/store/page.tsx src/app/wishlist/page.tsx
git commit -m "feat(routes): add placeholder pages for /quiz /store /wishlist

Co-authored-by: Claude <claude@anthropic.com>"
```

---

## Task 9: 瀏覽器視覺驗證（淺/深主題 + 三段 RWD）

**Files:** 無（驗證）。用 gstack `/qa` 或 `/browse` 開 dev server 實測。

- [ ] **Step 1: 啟動 dev server**

Run: `pnpm dev`（背景）。開 `http://localhost:3000`。

- [ ] **Step 2: 主題驗證**
- 切換淺/深主題：背景、卡片、文字、primary 按鈕（赤陶）、邊框、陰影、focus ring 皆換色。
- wordmark 金點 `.` 在兩主題皆為金色。
- shadcn 元件（任一既有頁的 Button/Card）吃到新色。

- [ ] **Step 3: RWD 驗證（DevTools 響應式）**
- **桌機 ≥1200**：Header 公告列 + 桌機 nav（選購/虛擬試戴/臉型測驗/門市）+ 4 個 icon 動作 tooltip（hover/focus 顯示）；Footer 四欄；容器置中 max 1320、padding 56。
- **平板 768–900**：桌機 nav 消失、底部 MobileNav 出現五項；Footer 兩欄；LineFab 不擋底部 nav；內容底部不被遮。
- **手機 <600 / <520**：wordmark 不被 icon 擠掉/換行；底部 nav 五項均分；Footer 單欄堆疊。

- [ ] **Step 4: a11y / motion**
- 鍵盤 Tab 走訪：icon 動作、nav、底部 nav 皆有赤陶 `:focus-visible` 外框；滑鼠點擊不顯示外框。
- 開系統「減少動態效果」：tooltip / 既有 reveal 動畫停用、無破版。

- [ ] **Step 5: warm 效能抽量（字型影響）**
- `pnpm build && pnpm start`，對首頁連打 5 次取 median TTFB/total。
- 對照 CLAUDE.md 預算（warm total <500ms）。若超標，記錄數字待 PR 說明取捨（中文 webfont 為主因）。

- [ ] **Step 6: 修正發現的問題**
- 任何破版/對比/遮擋問題，回對應 Task 的檔案修正並 commit（`fix(...)`）。

---

## Self-Review 對照（spec → plan）

- A.1 token 覆寫 → Task 1 Step 2/3 ✓（含命名衝突：accent 赤陶→primary、accent-soft→shadcn accent）
- A.2 新語義 token → Task 1 Step 1/2/3（@theme + :root + .dark）✓
- A.3 圓角/陰影/斷點 → Task 1 Step 1/2/3 ✓
- A.4 `.container`/`.eyebrow`/字型 helper → Task 1 Step 4（helper 經 @theme `font-serif`/`font-display`/`font-mono`）✓
- B 字型 → Task 2 ✓
- C.1 Header → Task 5 ✓
- C.2 Footer → Task 6 ✓
- C.3 底部 MobileNav + 移除漢堡 + LineFab 避讓 → Task 4 + Task 7 ✓
- C.4 Tooltip → Task 3（base-ui 或 [data-tip] 後備）✓
- C.5 placeholder 路由 + /tryon 沿用 → Task 8 + Task 5 NAV 連 /tryon ✓
- D RWD → 各元件 `nav:` 斷點 + Task 9 三段驗證 ✓
- G 驗證 → Task 9 ✓
- H git → 各 Task commit + 兩段式 PR（執行後）✓

> 已知後續可能微調：lucide 圖示名（`GitCompareArrows` vs `GitCompare`）、base-ui Tooltip 實際 API、Tailwind `.container` 類名衝突 — 皆於對應 Task 的 typecheck/build 步驟攔截並就地修正。
