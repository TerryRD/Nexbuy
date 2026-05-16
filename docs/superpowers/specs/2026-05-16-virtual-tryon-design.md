# 虛擬試戴（Virtual Try-On）設計文件

> Date: 2026-05-16
> Status: Design approved, ready for implementation plan
> Owner: Terry31415926
> Predecessor: Phase 2 try-on PRs (#28fac29 + #2eafad9) — reverted in 5547e78
> 已撤的原因：當時走「remove.bg 自動去背」自動化路線，眼鏡類商品的透明銜接品質不夠好

## TL;DR

讓顧客在 `/tryon` 上傳一張正面自拍照、選眼鏡商品、瀏覽器端用 MediaPipe Face Landmarker 偵測臉、把眼鏡的去背 PNG 疊上去模擬試戴效果。三個滑桿（寬度 / 高低 / 角度）讓顧客微調。試戴後可以下載結果圖、加入購物車、預約到店配鏡、或看詳情。

**所有處理都在瀏覽器內完成、自拍照不離開裝置**。

## 為什麼這次能成

上次 Phase 2 失敗的點是「自動去背品質」。這次：

1. **不走自動去背** — admin 上傳前自己用 Photoshop / Photoroom / Photopea 等工具去背，品質可控
2. **只接受正面自拍** — 避開 2D 疊圖最容易破功的側臉場景
3. **獨立 `/tryon` 頁面** — 顧客知道是在用「實驗性試戴功能」、心理期望值對齊
4. **三滑桿微調** — 即使初始位置稍偏、顧客可以自己拉到對

## 不在範圍內

明確列出來避免 scope creep：

- ❌ 即時 webcam AR 試戴（要 SDK、性能、隱私三項一起貴）
- ❌ 側臉 / 多角度試戴（只接受正面）
- ❌ 頭髮 / 瀏海遮擋眼鏡的合成（要 segmentation）
- ❌ 鏡片反射 / 折射效果
- ❌ 試戴行為分析（哪副被試最多）— 有趣但本期不收集
- ❌ 跨頁面保留自拍照（離開 `/tryon` 就消失、回來重傳）
- ❌ 自動去背（Phase 2 已驗證失敗、改人工）
- ❌ 3D 模型 / 鏡腳變形 / 真實透視

---

## 需求摘要

| 維度 | 決定 |
|------|------|
| 適用商品 | 全部 — finished 太陽眼鏡 + prescription_frame 處方鏡架 |
| 入口 | 獨立 `/tryon` 頁；商品詳情頁加連結 `?product=<slug>` |
| 自拍來源 | 只接受相簿上傳（不開現場攝影機）|
| 商品圖前處理 | Admin 手動上傳預先去背的透明 PNG |
| 計算位置 | 自動 placement + 三滑桿微調（寬度 / 高低 / 角度）|
| 試戴後 CTA | 看詳情、下載試戴圖、加入購物車（成品）、預約到店（處方）|
| 品質把關 | 嚴格 — 沒臉 / 側臉 / 太暗都擋下要求重拍 |
| 隱私 | 自拍照完全留在瀏覽器、不上傳任何 server |

---

## 架構

```
[ Customer Browser ]
    ├─ /tryon  (App Router RSC, fetch product list)
    │     │
    │     └─ <TryOnClient> (client component)
    │            ├─ Upload selfie → ImageBitmap (in-memory only)
    │            ├─ MediaPipe FaceLandmarker (WASM) → 478 landmarks
    │            ├─ Quality gates (face / brightness / yaw)
    │            ├─ Compute initial placement
    │            ├─ Canvas compositing (selfie + glasses PNG)
    │            ├─ 3 sliders → re-render
    │            └─ CTA: download / addToCart / book / view detail
    │
    └─ Glasses PNG: GET from Supabase Storage (public, cacheable)

[ Supabase ]
    ├─ products.try_on_image_url text (nullable)  — re-added
    ├─ storage bucket: try-on-images              — exists, idempotent restore policies
    └─ NO selfie tables / buckets                 — selfie never leaves browser

[ Admin ]
    └─ /admin/products/[id]/edit
          └─ ProductForm: 「試戴用透明 PNG」上傳欄位 (PNG-only, 5MB)
```

### 關鍵套件

| 套件 | 用途 | 大小 | License |
|------|------|------|---------|
| `@mediapipe/tasks-vision` | Face landmark detection（478 landmarks）| WASM ~5MB（首載後 cache）| Apache 2.0 |
| `@radix-ui/react-slider` (via shadcn `slider.tsx`) | 三個微調滑桿 | ~10KB | MIT |

不引入：face-api.js（舊、TensorFlow.js 太重）、Three.js（沒 3D 模型不需要）、@imgly/background-removal（不用客戶端去背）。

---

## 檔案結構

### 新增

```
nexbuy-web/
├── supabase/migrations/
│   └── 20260516000000_try_on_image_restore.sql        — re-add column + idempotent bucket policies
│
├── src/app/tryon/
│   ├── page.tsx                                       — RSC: fetch products WHERE try_on_image_url IS NOT NULL
│   ├── TryOnClient.tsx                                — Client container, state machine
│   ├── components/
│   │   ├── SelfieUploader.tsx                         — empty-state + file picker
│   │   ├── TryOnCanvas.tsx                            — <canvas> + render loop
│   │   ├── ProductCarousel.tsx                        — bottom horizontal scroll
│   │   ├── AdjustmentSliders.tsx                      — 3 sliders (width / y / angle)
│   │   ├── ActionBar.tsx                              — download / addToCart / book / detail
│   │   └── QualityError.tsx                           — retake prompt with reason
│   └── lib/
│       ├── face-detector.ts                           — MediaPipe wrapper (init + detect)
│       ├── quality-check.ts                           — 3 gates (face / brightness / yaw)
│       ├── glasses-placer.ts                          — landmarks → {cx, cy, w, angle}
│       └── canvas-renderer.ts                         — compositing function
│
└── src/components/ui/
    └── slider.tsx                                     — npx shadcn add slider
```

### 修改

```
nexbuy-web/src/
├── lib/types/database.ts                              — Product 介面加 try_on_image_url: string | null
│
├── app/admin/(protected)/products/
│   ├── ProductForm.tsx                                — +1 「試戴用透明 PNG」上傳欄位（可參考 git #28fac29）
│   └── actions.ts                                     — uploadIfPresent 抽象化、create/update 處理 try_on_image_url
│
├── app/products/[slug]/page.tsx
│     └─ 有 try_on_image_url 時加「虛擬試戴」連結 → /tryon?product=<slug>
│
└── components/site/Header.tsx
      └─ 主導覽列加「試戴」連結（插在「商品」之後）；mobile 漢堡選單同步加
```

### 測試

```
nexbuy-web/src/app/tryon/lib/
├── quality-check.test.ts
└── glasses-placer.test.ts
```

---

## 狀態機

```
┌─────────┐
│  IDLE   │  空狀態：說明 + 上傳鍵 + 隱私提示
└────┬────┘
     │ user picks file
     ▼
┌──────────────┐
│ LOADING_MODEL │ 首次：dynamic import MediaPipe ~5MB
└────┬─────────┘   之後：cache hit ~50ms
     ▼
┌──────────────┐
│  ANALYZING   │ detect() + quality-check
└────┬─────────┘
     │
     ├─ fail ──▶ ┌──────────────┐
     │           │ QUALITY_FAIL │ reason + 重新上傳鍵
     │           └─────┬────────┘
     │                 │ user picks file
     │                 └──────────▶ ANALYZING
     │
     └─ ok ────▶ ┌──────────┐
                 │  READY   │ 主要使用畫面
                 └─────┬────┘
                       │ 切款 / 拖滑桿 / CTA
                       └─▶ (redraw, 留在 READY)
```

### TypeScript 型別

```typescript
type Phase =
  | { kind: 'idle' }
  | { kind: 'loading-model' }
  | { kind: 'analyzing' }
  | { kind: 'quality-fail'; reason: 'no-face' | 'too-dark' | 'side-face' }
  | { kind: 'ready'; selfie: ImageBitmap; landmarks: NormalizedLandmark[]; basePlacement: Placement };

type Placement = { cx: number; cy: number; w: number; h: number; angle: number };
type Adjustment = { widthScale: number; yOffset: number; angle: number };
```

---

## 資料 in / out

| 資料 | 從哪來 | 怎麼來 | 怎麼走 |
|------|--------|--------|--------|
| 商品清單 | Supabase `products` | RSC `page.tsx` 預抓、`try_on_image_url IS NOT NULL` AND `is_online_available = true` AND `deleted_at IS NULL` | 透過 props 傳給 `<TryOnClient>` |
| 眼鏡 PNG | Supabase Storage `try-on-images/*` | `<img>` 載入後變 `HTMLImageElement` 給 canvas；carousel 前 3 副 `<link rel="preload">` | 不離開瀏覽器 |
| 自拍照 | `<input type="file" accept="image/*">` | `createImageBitmap(file, { resizeWidth: 1280 })` 縮到最長邊 1280px | **完全留在記憶體、tab 關掉就消失** |
| 試戴結果 | `<canvas>` | `requestAnimationFrame` 在 state change 時重畫 | 下載：`canvas.toBlob() → URL.createObjectURL → <a download>` |
| 購物車 | `useCart()` (既有) | localStorage（既有 cart 機制）| addToCart 後 `router.push('/cart')` |
| 預約 | — | — | `router.push('/appointment/book/${slug}')` |

---

## 演算法

### Initial placement（自動）

MediaPipe `FaceLandmarker` 回傳的 landmark 座標是 **normalized [0, 1]**（相對於輸入影像寬高）。下面公式內的 `lm` 為 normalized；最終 placement 換算成像素時乘上 selfie 的 `naturalWidth` / `naturalHeight`。

從 478 landmarks 取三個關鍵點（索引以 MediaPipe FaceLandmarker 為準、實作時需對照官方 [face_landmarker_topology](https://developers.google.com/mediapipe/solutions/vision/face_landmarker#models) 確認）：

- `33`：左眼外眥（顧客觀看者的左、模型的右）
- `263`：右眼外眥
- `168`：眉間 / 鼻樑頂端
- `1`：鼻尖（用於 yaw 判斷）

計算（normalized 座標 → 乘 selfie 像素尺寸後給 canvas）：

```
cx_norm = (lm[33].x + lm[263].x) / 2     // 水平中心
cy_norm = lm[168].y                      // 垂直位置（眉間）
eyeWidth_norm = distance(lm[33], lm[263])
w_norm = eyeWidth_norm × 2.1             // 眼鏡寬度約為瞳距 × 2.1（成人經驗值）

// 換算成 canvas 像素
cx = cx_norm × selfieWidth
cy = cy_norm × selfieHeight
w  = w_norm  × selfieWidth
h  = w × (glassesPng.naturalHeight / glassesPng.naturalWidth)  // 用 PNG 原比例
angle = atan2(lm[263].y - lm[33].y, lm[263].x - lm[33].x)
```

### Adjustment（滑桿）

```typescript
function applyAdjustment(base: Placement, adj: Adjustment): Placement {
  return {
    cx: base.cx,
    cy: base.cy + adj.yOffset,
    w: base.w * adj.widthScale,
    h: base.h * adj.widthScale,                    // 等比例
    angle: base.angle + adj.angle,
  };
}
```

滑桿範圍：
- `widthScale`: 0.7 – 1.3（±30%）
- `yOffset`: -0.05 – +0.05（normalized 比例、約畫面高度 ±5%，最終以 canvas 像素為單位 = `yOffset × selfieHeight`）
- `angle`: -0.26 – +0.26 弧度（±15°）

採用 normalized yOffset 而非固定像素，避免不同尺寸照片下「拉同樣多移動距離不一樣」的詭異感。

### Quality gates

依序檢查（短路）：

1. **G1 face presence**: `result.faceLandmarks.length === 0` → `no-face`
2. **G2 brightness**: 把 selfie 縮成 64×64、計算平均 luma `0.299R + 0.587G + 0.114B`，< 60（0-255 區間）→ `too-dark`
3. **G3 frontality**: 計算 `|x(33) - x(1)|` 與 `|x(263) - x(1)|`（鼻尖是 landmark 1、所有座標 normalized）；`max / min > 1.3`（任一側距離超過另一側 30% 以上）→ `side-face`

---

## Schema 變更

### Migration: `20260516000000_try_on_image_restore.sql`

要點：

1. **欄位**：`alter table products add column if not exists try_on_image_url text;`（nullable，符合 conventions.md §4）
2. **Bucket**：`insert ... on conflict (id) do update`（idempotent，bucket 因前次 revert 還在 prod）
3. **Policies**：`drop policy if exists ...` 再 `create policy ...`（同 PR #28fac29 的四條 policy：public read、admin insert/update/delete）

註解寫清楚這是 Phase 2 重啟、與 git #28fac29 的差異（這次不接 remove.bg）。

### Type 更新

`src/lib/types/database.ts`:

```typescript
export interface Product {
  // ... existing fields
  try_on_image_url: string | null;  // 新增
}
```

### UI 容忍 null（conventions.md §4 規則 2）

- `/products/[slug]/page.tsx`: 只在 `product.try_on_image_url` 非 null 時顯示「虛擬試戴」連結
- `/tryon/page.tsx`: RSC `select(...).not('try_on_image_url', 'is', null)`，根本不抓沒準備好的商品
- Admin product list / detail: 不依賴此欄位（不影響既有 admin 操作）

---

## 效能預算

依 `CLAUDE.md` 效能規範：

| 路徑 | TTFB 目標 | 怎麼達 |
|------|----------|--------|
| `/tryon` RSC | < 300ms warm | 一個 SELECT 抓商品、不重 — 跟 `/products` 同量級 |
| `/tryon` total | < 500ms warm | + MediaPipe `dynamic import` 不阻塞首屏 |
| 初次 MediaPipe 載入 | < 3s on 4G | WASM ~5MB CDN cached、`<link rel="preload" as="script">` |
| Face detection 推論 | < 1s on mid-tier mobile | 單張靜態圖、不跑 video stream |
| Canvas redraw | 60 fps | 兩層 drawImage、無 filter |

`/tryon` 不在 `vercel.json` cron 或 ISR 範圍，純 SSR。region 鎖 `hnd1`（已是 default）。

---

## 錯誤處理

| 情況 | 處理 |
|------|------|
| Upload 不是圖片（fake extension）| `createImageBitmap()` 拋 error → 「無法讀取這張圖、請換一張」 |
| Upload > 10MB | `file.size` 擋下 → 「圖片太大、請選 10MB 以下」 |
| Upload 4K+ | `createImageBitmap(file, { resizeWidth: 1280 })` 自動縮 |
| MediaPipe CDN fail / 不支援瀏覽器 | 偵測 `typeof WebAssembly === 'undefined'` 或 `dynamic import('@mediapipe/tasks-vision')` 失敗 → 「您的瀏覽器不支援試戴功能、可瀏覽商品或預約到店」+ 回 `/products` 連結 |
| 眼鏡 PNG 載入失敗 | 該 carousel 格子顯示「無法載入」、其他款仍可用 |
| 切款時滑桿值 | 自動重置 `{ widthScale: 1, yOffset: 0, angle: 0 }`（每副獨立微調）|
| 商品 try_on_image_url 為 NULL | RSC 階段 filter 掉、不出現在 carousel |

錯誤 reason 顯示給顧客的中文文案（明確、不指責）：

```
no-face   → 找不到你的臉。請拍一張正面、明亮、五官清楚的自拍。
too-dark  → 照片太暗了。試試明亮一點的地方再拍一次。
side-face → 需要正面照才能準確試戴。請正對鏡頭拍一張。
```

---

## 測試

### Vitest unit（自動化）

| 檔案 | 測什麼 |
|------|--------|
| `quality-check.test.ts` | G1/G2/G3 各別 OK / fail；fixture landmarks 手刻 |
| `glasses-placer.test.ts` | 給已知 landmarks 算 initial placement、驗範圍；套不同 adjustment 驗線性變化 |

不測：MediaPipe `detect()` 本體、Canvas 渲染、React 元件互動（基礎建設不存在、引入 Playwright 是另一個工程）。

### 手動 QA checklist

合 PR 前跑一次，分類：

- **Upload 邊界**：正面 OK / 側臉 fail / 黑圖 fail / 風景 fail / 假副檔名 / 12MB 巨檔
- **互動**：切款後滑桿重置、拉寬度、拉高低、拉角度
- **CTA**：下載 PNG、加購物車（成品）、預約（處方）、看詳情
- **進場**：`/tryon?product=xxx` 自動選中、`/tryon` 空狀態
- **裝置**：iOS Safari、Android Chrome、macOS Chrome、Windows Chrome
- **RWD**：320px 寬不破版
- **Admin**：上傳透明 PNG → /tryon 立刻可見、沒上傳的不出現
- **Perf**：`/tryon` TTFB < 300ms warm、MediaPipe 首載 < 3s on 4G

### Production smoke

合到 dev 後 Vercel preview 真實手機跑 happy path + 兩個 fail case（側臉、暗光）。

---

## 文件更新（實作完成時要做）

實作完成的 PR 必須同步更新：

### `docs/operating-manual-admin.md`

在「商品管理」章節後新增：

- **「試戴專用透明 PNG」欄位說明** — 為什麼要、跟主圖差在哪
- **去背工具推薦清單** — Photoroom / Pixelcut / Photopea，附操作步驟連結
- **「好的試戴 PNG」長相** — 例圖、解析度建議、置中、無陰影
- **如何驗證** — 上傳後到 `/tryon` 確認顯示
- **沒上傳 try-on PNG 的商品行為** — 不會出現在 `/tryon`、無痛

### `docs/operating-manual-customer.md`

新增「虛擬試戴」章節：

- **怎麼進入** — 主導覽「試戴」、或商品詳情頁「虛擬試戴」按鈕
- **怎麼用** — 上傳一張正面自拍、選眼鏡、可微調、可下載
- **隱私說明** — 「您的自拍照只會在您的瀏覽器顯示、不會上傳到我們的伺服器」
- **拍不出好結果怎麼辦** — 提示文案、建議重拍

### 不更新 `docs/roadmap.md`（會由實作 PR 決定 ship date）

---

## Open questions / future work

1. **MediaPipe WASM 5MB 首載** — 是否能更小？目前已是 `@mediapipe/tasks-vision` 最精簡。可能要等 Google 出 quantized 版
2. **是否要把 /tryon 預載到 service worker** — Phase 2.5 議題
3. **滑桿微調記憶** — 同一顧客同一商品下次來是否保留調整？目前 by design 不保留（不認 device、不發 session）
4. **「試戴最多」分析** — 未來收集匿名統計可指導採購（哪副被試最多）
5. **AI 生成路線備案** — 如果 2D 疊圖實測效果差、改 Gemini Image 路線；spec 暫不展開

---

## Approvals

- [x] Brainstorming complete (this doc)
- [ ] User review of this spec
- [ ] writing-plans skill → implementation plan
- [ ] Plan execution per CLAUDE.md PR flow (feat/* → dev → main)
