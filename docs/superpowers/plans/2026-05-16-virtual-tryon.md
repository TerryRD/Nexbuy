# Virtual Try-On Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/tryon` page where customers upload a frontal selfie and see eyewear products overlaid on their face in 2D, with adjustable width/position/angle and CTAs to buy, book, download, or view details. Plus admin upload UI for the transparent PNG.

**Architecture:** Fully client-side: MediaPipe Face Landmarker (WASM) runs in the browser, selfie never uploaded anywhere. Glasses PNG (pre-cropped by admin manually) is fetched from Supabase Storage and composited over the selfie via Canvas 2D. Three sliders allow micro-adjustment of an auto-computed initial placement.

**Tech Stack:** Next.js 16 App Router + React 19 + TypeScript strict, Supabase (Postgres + Storage), Tailwind 4 + shadcn/ui, `@mediapipe/tasks-vision`, Vitest (Node env, pure-function tests only).

**Spec:** [`docs/superpowers/specs/2026-05-16-virtual-tryon-design.md`](../specs/2026-05-16-virtual-tryon-design.md)

**Branch:** `feat/virtual-tryon` (already created in `.worktrees/feat/virtual-tryon`)

**Working directory for all tasks:** `C:/VisualDev/Nexbuy/.worktrees/feat/virtual-tryon`

---

## Task 1: Install dependencies

**Files:**
- Modify: `nexbuy-web/package.json` (via pnpm)
- Create: `nexbuy-web/src/components/ui/slider.tsx` (via shadcn CLI)

- [ ] **Step 1: Add MediaPipe**

Run from worktree root:

```bash
cd nexbuy-web
pnpm add @mediapipe/tasks-vision
```

Expected: package added to `dependencies`, lockfile updated.

- [ ] **Step 2: Add shadcn slider**

```bash
pnpm dlx shadcn@latest add slider
```

When prompted, confirm overwrites for any existing files. Should create `src/components/ui/slider.tsx`.

- [ ] **Step 3: Verify install**

```bash
pnpm typecheck
```

Expected: no new errors (existing codebase passes).

- [ ] **Step 4: Commit**

```bash
git add nexbuy-web/package.json nexbuy-web/pnpm-lock.yaml nexbuy-web/src/components/ui/slider.tsx
git commit -m "$(cat <<'EOF'
chore(tryon): add @mediapipe/tasks-vision + shadcn slider

Co-authored-by: Claude <claude@anthropic.com>
EOF
)"
```

---

## Task 2: Migration — restore try_on_image_url

**Files:**
- Create: `nexbuy-web/supabase/migrations/20260516000000_try_on_image_restore.sql`

**Context:** Bucket `try-on-images` still exists in prod Supabase (couldn't be SQL-deleted in prior revert). Migration must be idempotent on bucket — use `on conflict (id) do update` and `drop policy if exists` patterns. Mirror policies from `product-images` (PR #28fac29 was the source).

- [ ] **Step 1: Write the migration**

```sql
-- nexbuy-web/supabase/migrations/20260516000000_try_on_image_restore.sql
--
-- Phase 2 try-on restoration. The prior PR (#28fac29 + #2eafad9) was
-- reverted in 5547e78 because the remove.bg auto-bg-removal path produced
-- inadequate eyewear cutouts. This time we drop auto-removal entirely —
-- admin uploads a pre-cropped transparent PNG manually.
--
-- The storage bucket `try-on-images` was NOT removed in the revert
-- (Supabase's storage triggers block SQL deletes). This migration is
-- idempotent: column add uses `if not exists`, bucket uses `on conflict do
-- update`, policies are dropped + recreated.

set search_path = public;

-- 1. products.try_on_image_url (nullable per conventions §4)

alter table products add column if not exists try_on_image_url text;

-- 2. Storage bucket: try-on-images (PNG-only, 5 MiB, public read)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'try-on-images',
  'try-on-images',
  true,
  5242880,
  array['image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 3. Policies (mirror product-images: public read, admin write)

drop policy if exists "try-on images public read" on storage.objects;
drop policy if exists "try-on images admin insert" on storage.objects;
drop policy if exists "try-on images admin update" on storage.objects;
drop policy if exists "try-on images admin delete" on storage.objects;

create policy "try-on images public read" on storage.objects
  for select using (bucket_id = 'try-on-images');

create policy "try-on images admin insert" on storage.objects
  for insert with check (bucket_id = 'try-on-images' and public.is_admin());

create policy "try-on images admin update" on storage.objects
  for update using (bucket_id = 'try-on-images' and public.is_admin())
  with check (bucket_id = 'try-on-images' and public.is_admin());

create policy "try-on images admin delete" on storage.objects
  for delete using (bucket_id = 'try-on-images' and public.is_admin());
```

- [ ] **Step 2: Run migration locally**

```bash
cd nexbuy-web
supabase db reset
```

Expected: all migrations apply cleanly, including the new one. Look for `apply` log line for `20260516000000_try_on_image_restore.sql`.

- [ ] **Step 3: Verify column exists**

```bash
supabase db diff --schema public
```

Or via psql to local instance:

```bash
supabase db inspect --table products | grep try_on_image_url
```

Expected: column appears in `products` table.

- [ ] **Step 4: Commit**

```bash
git add nexbuy-web/supabase/migrations/20260516000000_try_on_image_restore.sql
git commit -m "$(cat <<'EOF'
feat(tryon): re-add products.try_on_image_url + storage bucket policies

Idempotent restoration of Phase 2 schema (prev. reverted in 5547e78). This
slice does the DB layer only; admin upload UI and customer /tryon page
arrive in subsequent commits.

Co-authored-by: Claude <claude@anthropic.com>
EOF
)"
```

---

## Task 3: Type updates

**Files:**
- Modify: `nexbuy-web/src/lib/types/database.ts`
- Modify: `nexbuy-web/src/lib/schemas/product.ts` (if it lists columns)

- [ ] **Step 1: Add try_on_image_url to Product interface**

Edit `nexbuy-web/src/lib/types/database.ts`:

```typescript
export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_urls: string[];
  brand: string | null;
  kind: ProductKind;
  finished_stock: number | null;
  is_online_available: boolean;
  try_on_image_url: string | null;  // ← add
  // ... (preserve other existing fields)
}
```

- [ ] **Step 2: Verify Product schema**

Read `nexbuy-web/src/lib/schemas/product.ts`. If it has a Zod schema that lists product columns (for input validation), no change needed — `try_on_image_url` is set via separate upload, not the main form schema. If there's any explicit type that needs `try_on_image_url`, add it as `z.string().nullable().optional()`.

- [ ] **Step 3: typecheck**

```bash
cd nexbuy-web
pnpm typecheck
```

Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add nexbuy-web/src/lib/types/database.ts nexbuy-web/src/lib/schemas/product.ts
git commit -m "$(cat <<'EOF'
feat(tryon): add try_on_image_url to Product type

Co-authored-by: Claude <claude@anthropic.com>
EOF
)"
```

---

## Task 4: lib/quality-check.ts (TDD)

**Files:**
- Create: `nexbuy-web/src/app/tryon/lib/quality-check.ts`
- Create: `nexbuy-web/tests/tryon/quality-check.test.ts`

**Context:** Pure function. Takes (landmarks array from MediaPipe, average luma value) and returns `{ ok: true } | { ok: false, reason: 'no-face' | 'too-dark' | 'side-face' }`. Brightness is computed separately (by the caller — needs canvas) and passed in as a number.

- [ ] **Step 1: Write the failing test**

Create `nexbuy-web/tests/tryon/quality-check.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { checkQuality, type Landmark } from "@/app/tryon/lib/quality-check";

// Helper to build a fake landmark
const lm = (x: number, y: number): Landmark => ({ x, y, z: 0 });

// A minimal 264-element landmark array (MediaPipe FaceLandmarker returns 478,
// but the quality check only reads indices 1, 33, 263, so we fill 264 entries
// to make access at 263 valid).
function buildFrontalLandmarks(): Landmark[] {
  const arr: Landmark[] = new Array(264).fill(lm(0.5, 0.5));
  arr[1] = lm(0.5, 0.5);     // nose tip (centered)
  arr[33] = lm(0.4, 0.45);   // left eye outer corner
  arr[263] = lm(0.6, 0.45);  // right eye outer corner — symmetric
  return arr;
}

function buildSideLandmarks(): Landmark[] {
  const arr = buildFrontalLandmarks();
  // Push the nose far to one side so left eye is much closer to nose than right
  arr[1] = lm(0.43, 0.5);
  arr[33] = lm(0.4, 0.45);
  arr[263] = lm(0.7, 0.45);
  return arr;
}

describe("checkQuality", () => {
  it("returns no-face when landmarks empty", () => {
    expect(checkQuality([], 200)).toEqual({ ok: false, reason: "no-face" });
  });

  it("returns too-dark when luma below 60", () => {
    expect(checkQuality(buildFrontalLandmarks(), 30)).toEqual({
      ok: false,
      reason: "too-dark",
    });
  });

  it("returns side-face when nose is asymmetric", () => {
    expect(checkQuality(buildSideLandmarks(), 200)).toEqual({
      ok: false,
      reason: "side-face",
    });
  });

  it("returns ok on frontal well-lit face", () => {
    expect(checkQuality(buildFrontalLandmarks(), 200)).toEqual({ ok: true });
  });

  it("brightness check runs even with no face (no-face wins)", () => {
    // no-face short-circuits before brightness
    expect(checkQuality([], 10)).toEqual({ ok: false, reason: "no-face" });
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
cd nexbuy-web
pnpm test tests/tryon/quality-check.test.ts
```

Expected: FAIL with module-not-found error for `quality-check`.

- [ ] **Step 3: Write the implementation**

Create `nexbuy-web/src/app/tryon/lib/quality-check.ts`:

```typescript
// Pure quality gates for try-on selfies. No browser APIs — caller computes
// average luma from canvas and passes it in.

export interface Landmark {
  x: number; // normalized 0..1
  y: number; // normalized 0..1
  z: number;
}

export type QualityResult =
  | { ok: true }
  | { ok: false; reason: "no-face" | "too-dark" | "side-face" };

const BRIGHTNESS_MIN = 60; // 0..255 luma
const FRONTALITY_RATIO_MAX = 1.3; // max(L,R)/min(L,R) — bigger = more profile

/**
 * Gate ordering (short-circuit on first fail):
 *   1. no-face: landmarks empty
 *   2. too-dark: avg luma < BRIGHTNESS_MIN
 *   3. side-face: asymmetry between left-eye-to-nose vs right-eye-to-nose
 *      horizontal distances exceeds FRONTALITY_RATIO_MAX
 *
 * Landmark indices follow MediaPipe FaceLandmarker convention:
 *   1   = nose tip
 *   33  = left eye outer corner (viewer's left)
 *   263 = right eye outer corner
 */
export function checkQuality(
  landmarks: Landmark[],
  avgLuma: number,
): QualityResult {
  if (landmarks.length === 0) {
    return { ok: false, reason: "no-face" };
  }
  if (avgLuma < BRIGHTNESS_MIN) {
    return { ok: false, reason: "too-dark" };
  }

  const nose = landmarks[1];
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];

  const leftDist = Math.abs(nose.x - leftEye.x);
  const rightDist = Math.abs(rightEye.x - nose.x);

  // Guard against degenerate (both zero) cases
  if (leftDist === 0 || rightDist === 0) {
    return { ok: false, reason: "side-face" };
  }

  const ratio = Math.max(leftDist, rightDist) / Math.min(leftDist, rightDist);
  if (ratio > FRONTALITY_RATIO_MAX) {
    return { ok: false, reason: "side-face" };
  }

  return { ok: true };
}
```

- [ ] **Step 4: Run test, verify pass**

```bash
pnpm test tests/tryon/quality-check.test.ts
```

Expected: 5 passing.

- [ ] **Step 5: Commit**

```bash
git add nexbuy-web/src/app/tryon/lib/quality-check.ts nexbuy-web/tests/tryon/quality-check.test.ts
git commit -m "$(cat <<'EOF'
feat(tryon): quality-check lib with face/brightness/frontality gates

Co-authored-by: Claude <claude@anthropic.com>
EOF
)"
```

---

## Task 5: lib/glasses-placer.ts (TDD)

**Files:**
- Create: `nexbuy-web/src/app/tryon/lib/glasses-placer.ts`
- Create: `nexbuy-web/tests/tryon/glasses-placer.test.ts`

**Context:** Two pure functions:
- `computeBasePlacement(landmarks, glassesAspect, selfiePixelSize)` → `Placement` (cx, cy, w, h, angle) in pixels
- `applyAdjustment(base, adj, selfieHeight)` → adjusted Placement

- [ ] **Step 1: Write the failing test**

Create `nexbuy-web/tests/tryon/glasses-placer.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  computeBasePlacement,
  applyAdjustment,
  type Landmark,
} from "@/app/tryon/lib/glasses-placer";

const lm = (x: number, y: number): Landmark => ({ x, y, z: 0 });

function buildLandmarks(): Landmark[] {
  // Eyes at y=0.45, 30% screen-width apart, eyebrow at y=0.4
  const arr: Landmark[] = new Array(264).fill(lm(0.5, 0.5));
  arr[33] = lm(0.4, 0.45);
  arr[263] = lm(0.7, 0.45);
  arr[168] = lm(0.55, 0.4);
  return arr;
}

describe("computeBasePlacement", () => {
  it("places glasses center between eyes horizontally", () => {
    const p = computeBasePlacement(
      buildLandmarks(),
      { naturalWidth: 200, naturalHeight: 80 },
      { width: 1000, height: 1000 },
    );
    // cx = (0.4 + 0.7) / 2 * 1000 = 550
    expect(p.cx).toBeCloseTo(550, 1);
  });

  it("places glasses vertically at eyebrow", () => {
    const p = computeBasePlacement(
      buildLandmarks(),
      { naturalWidth: 200, naturalHeight: 80 },
      { width: 1000, height: 1000 },
    );
    // cy = 0.4 * 1000 = 400
    expect(p.cy).toBeCloseTo(400, 1);
  });

  it("scales glasses width to eye-distance * 2.1", () => {
    const p = computeBasePlacement(
      buildLandmarks(),
      { naturalWidth: 200, naturalHeight: 80 },
      { width: 1000, height: 1000 },
    );
    // eye distance normalized = 0.3, width = 0.3 * 1000 * 2.1 = 630
    expect(p.w).toBeCloseTo(630, 1);
  });

  it("preserves PNG aspect ratio in height", () => {
    const p = computeBasePlacement(
      buildLandmarks(),
      { naturalWidth: 200, naturalHeight: 80 },
      { width: 1000, height: 1000 },
    );
    // h = w * (80 / 200) = 630 * 0.4 = 252
    expect(p.h).toBeCloseTo(252, 1);
  });

  it("returns angle 0 for horizontal eye line", () => {
    const p = computeBasePlacement(
      buildLandmarks(),
      { naturalWidth: 200, naturalHeight: 80 },
      { width: 1000, height: 1000 },
    );
    expect(p.angle).toBeCloseTo(0, 3);
  });

  it("returns positive angle when right eye is lower than left", () => {
    const arr = buildLandmarks();
    arr[263] = lm(0.7, 0.5); // right eye lower
    const p = computeBasePlacement(
      arr,
      { naturalWidth: 200, naturalHeight: 80 },
      { width: 1000, height: 1000 },
    );
    expect(p.angle).toBeGreaterThan(0);
  });
});

describe("applyAdjustment", () => {
  const base = { cx: 500, cy: 400, w: 600, h: 240, angle: 0 };

  it("widthScale scales w and h equally", () => {
    const a = applyAdjustment(base, { widthScale: 1.2, yOffset: 0, angle: 0 }, 1000);
    expect(a.w).toBeCloseTo(720, 1);
    expect(a.h).toBeCloseTo(288, 1);
    expect(a.cx).toBe(500);
    expect(a.cy).toBe(400);
  });

  it("yOffset shifts cy by normalized fraction of selfie height", () => {
    const a = applyAdjustment(base, { widthScale: 1, yOffset: 0.02, angle: 0 }, 1000);
    expect(a.cy).toBeCloseTo(420, 1); // 400 + 0.02 * 1000
  });

  it("angle adds to base angle", () => {
    const a = applyAdjustment(base, { widthScale: 1, yOffset: 0, angle: 0.1 }, 1000);
    expect(a.angle).toBeCloseTo(0.1, 3);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
pnpm test tests/tryon/glasses-placer.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `nexbuy-web/src/app/tryon/lib/glasses-placer.ts`:

```typescript
// Pure computation: landmarks + glasses PNG natural size → pixel placement.
// All input landmarks are normalized [0,1]; output is in canvas pixel space.

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface Placement {
  cx: number;    // center x, pixels
  cy: number;    // center y, pixels
  w: number;     // pixels
  h: number;     // pixels
  angle: number; // radians
}

export interface Adjustment {
  widthScale: number; // 0.7 .. 1.3
  yOffset: number;    // -0.05 .. 0.05, fraction of selfie height
  angle: number;      // -0.26 .. 0.26 radians
}

export interface GlassesAspect {
  naturalWidth: number;
  naturalHeight: number;
}

export interface SelfieSize {
  width: number;
  height: number;
}

const EYE_TO_GLASSES_WIDTH_RATIO = 2.1; // empirical: adult glasses width / IPD

/**
 * Compute the auto-placed (unadjusted) glasses position from face landmarks.
 *
 * Landmark indices:
 *   33  = left eye outer corner
 *   263 = right eye outer corner
 *   168 = eyebrow center / nose bridge top
 */
export function computeBasePlacement(
  landmarks: Landmark[],
  glassesAspect: GlassesAspect,
  selfie: SelfieSize,
): Placement {
  const left = landmarks[33];
  const right = landmarks[263];
  const brow = landmarks[168];

  const cxNorm = (left.x + right.x) / 2;
  const cyNorm = brow.y;
  const eyeWidthNorm = Math.hypot(right.x - left.x, right.y - left.y);
  const wNorm = eyeWidthNorm * EYE_TO_GLASSES_WIDTH_RATIO;

  // Convert to pixel space
  const cx = cxNorm * selfie.width;
  const cy = cyNorm * selfie.height;
  const w = wNorm * selfie.width;
  const h = w * (glassesAspect.naturalHeight / glassesAspect.naturalWidth);
  const angle = Math.atan2(right.y - left.y, right.x - left.x);

  return { cx, cy, w, h, angle };
}

/**
 * Apply user slider adjustments to a base placement. yOffset is normalized
 * (fraction of selfie height) so the same slider value moves the same visual
 * distance regardless of selfie resolution.
 */
export function applyAdjustment(
  base: Placement,
  adj: Adjustment,
  selfieHeight: number,
): Placement {
  return {
    cx: base.cx,
    cy: base.cy + adj.yOffset * selfieHeight,
    w: base.w * adj.widthScale,
    h: base.h * adj.widthScale,
    angle: base.angle + adj.angle,
  };
}

export const ADJUSTMENT_DEFAULTS: Adjustment = {
  widthScale: 1,
  yOffset: 0,
  angle: 0,
};

export const ADJUSTMENT_RANGES = {
  widthScale: { min: 0.7, max: 1.3, step: 0.01 },
  yOffset: { min: -0.05, max: 0.05, step: 0.001 },
  angle: { min: -0.26, max: 0.26, step: 0.005 },
} as const;
```

- [ ] **Step 4: Run test, verify pass**

```bash
pnpm test tests/tryon/glasses-placer.test.ts
```

Expected: 9 passing.

- [ ] **Step 5: Commit**

```bash
git add nexbuy-web/src/app/tryon/lib/glasses-placer.ts nexbuy-web/tests/tryon/glasses-placer.test.ts
git commit -m "$(cat <<'EOF'
feat(tryon): glasses-placer lib (auto-placement + slider adjustments)

Co-authored-by: Claude <claude@anthropic.com>
EOF
)"
```

---

## Task 6: lib/canvas-renderer.ts

**Files:**
- Create: `nexbuy-web/src/app/tryon/lib/canvas-renderer.ts`

**Context:** Pure function that takes a canvas context, selfie, glasses image, and placement, and draws. No test (canvas APIs not available in node vitest env; behavior is visually verified in manual QA).

- [ ] **Step 1: Write the renderer**

Create `nexbuy-web/src/app/tryon/lib/canvas-renderer.ts`:

```typescript
// Pure draw: clears canvas, paints selfie as base layer, paints glasses
// rotated/scaled/positioned on top.

import type { Placement } from "./glasses-placer";

export interface RenderInput {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  selfie: ImageBitmap | HTMLImageElement;
  glasses: HTMLImageElement | null;
  placement: Placement | null;
}

export function renderTryOn({
  ctx,
  canvas,
  selfie,
  glasses,
  placement,
}: RenderInput): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Layer 1: selfie (fills canvas, preserving aspect via cover-fit)
  ctx.drawImage(selfie, 0, 0, canvas.width, canvas.height);

  // Layer 2: glasses (skip if not ready)
  if (!glasses || !placement) return;
  if (!glasses.complete || glasses.naturalWidth === 0) return;

  ctx.save();
  ctx.translate(placement.cx, placement.cy);
  ctx.rotate(placement.angle);
  ctx.drawImage(
    glasses,
    -placement.w / 2,
    -placement.h / 2,
    placement.w,
    placement.h,
  );
  ctx.restore();
}

/**
 * Compute average luma (0..255) of an ImageBitmap, by downscaling to 64x64
 * onto an offscreen canvas. Used by the quality-check.
 */
export function computeAverageLuma(
  selfie: ImageBitmap,
): number {
  const SAMPLE = 64;
  const offscreen = document.createElement("canvas");
  offscreen.width = SAMPLE;
  offscreen.height = SAMPLE;
  const ctx = offscreen.getContext("2d");
  if (!ctx) return 255; // optimistic — don't trigger too-dark on env weirdness
  ctx.drawImage(selfie, 0, 0, SAMPLE, SAMPLE);
  const { data } = ctx.getImageData(0, 0, SAMPLE, SAMPLE);
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return sum / (SAMPLE * SAMPLE);
}

/**
 * Trigger a download of the current canvas content as PNG.
 */
export async function downloadCanvasAsPng(
  canvas: HTMLCanvasElement,
  filename: string,
): Promise<void> {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) throw new Error("無法產生圖片");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 2: Typecheck**

```bash
cd nexbuy-web
pnpm typecheck
```

Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add nexbuy-web/src/app/tryon/lib/canvas-renderer.ts
git commit -m "$(cat <<'EOF'
feat(tryon): canvas-renderer (compositing + luma + download helper)

Co-authored-by: Claude <claude@anthropic.com>
EOF
)"
```

---

## Task 7: lib/face-detector.ts

**Files:**
- Create: `nexbuy-web/src/app/tryon/lib/face-detector.ts`

**Context:** Thin wrapper around `@mediapipe/tasks-vision`'s `FaceLandmarker`. Lazy-loads WASM on first call. Exposes one async function: `detectFace(image): Promise<Landmark[]>` returning `[]` if no face.

- [ ] **Step 1: Write the wrapper**

Create `nexbuy-web/src/app/tryon/lib/face-detector.ts`:

```typescript
// Lazy-init wrapper around MediaPipe Tasks Vision FaceLandmarker.
// Singleton: model is downloaded once per page load, reused for all detections.

import {
  FilesetResolver,
  FaceLandmarker,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";

let landmarkerPromise: Promise<FaceLandmarker> | null = null;

const WASM_BASE =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task";

async function getLandmarker(): Promise<FaceLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
      return FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
        runningMode: "IMAGE",
        numFaces: 1,
      });
    })();
  }
  return landmarkerPromise;
}

/**
 * Detect face landmarks in a single still image. Returns 478 normalized
 * landmarks or [] if no face was found.
 */
export async function detectFace(
  image: ImageBitmap | HTMLImageElement,
): Promise<NormalizedLandmark[]> {
  const lm = await getLandmarker();
  const result = lm.detect(image);
  return result.faceLandmarks[0] ?? [];
}

/**
 * Probe whether the browser supports MediaPipe (WASM + the import). Use to
 * gracefully degrade on unsupported browsers.
 */
export function isMediaPipeSupported(): boolean {
  return typeof WebAssembly !== "undefined";
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: pass. If there are issues with `NormalizedLandmark` import, check the actual export name in `@mediapipe/tasks-vision` (it may be `Landmark` in some versions).

- [ ] **Step 3: Commit**

```bash
git add nexbuy-web/src/app/tryon/lib/face-detector.ts
git commit -m "$(cat <<'EOF'
feat(tryon): MediaPipe FaceLandmarker wrapper with lazy WASM init

Co-authored-by: Claude <claude@anthropic.com>
EOF
)"
```

---

## Task 8: SelfieUploader component

**Files:**
- Create: `nexbuy-web/src/app/tryon/components/SelfieUploader.tsx`

**Context:** Empty-state UI shown when no selfie is loaded. File picker + brief explainer + privacy note.

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

interface Props {
  onFile: (file: File) => void;
  onError: (message: string) => void;
}

export function SelfieUploader({ onFile, onError }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_BYTES) {
      onError("圖片太大,請選 10MB 以下");
      e.target.value = ""; // allow re-pick same file after fix
      return;
    }
    if (!file.type.startsWith("image/")) {
      onError("不是圖片檔");
      e.target.value = "";
      return;
    }
    onFile(file);
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 px-6 py-16 text-center">
      <Upload className="size-12 text-muted-foreground/60" />
      <div className="space-y-2 max-w-md">
        <h2 className="text-xl font-semibold">上傳一張正面自拍</h2>
        <p className="text-sm text-muted-foreground">
          明亮、五官清楚、正對鏡頭。我們會把你選的眼鏡疊到照片上、讓你看試戴效果。
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
      <Button size="lg" onClick={() => inputRef.current?.click()}>
        選照片
      </Button>
      <p className="text-xs text-muted-foreground max-w-sm">
        🔒 你的照片只會在你的瀏覽器處理,不會上傳到我們的伺服器或任何地方,離開頁面就消失。
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 3: Commit**

```bash
git add nexbuy-web/src/app/tryon/components/SelfieUploader.tsx
git commit -m "$(cat <<'EOF'
feat(tryon): SelfieUploader component (empty state + file picker)

Co-authored-by: Claude <claude@anthropic.com>
EOF
)"
```

---

## Task 9: QualityError component

**Files:**
- Create: `nexbuy-web/src/app/tryon/components/QualityError.tsx`

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { Button } from "@/components/ui/button";

const REASON_MESSAGES = {
  "no-face": "找不到你的臉。請拍一張正面、明亮、五官清楚的自拍。",
  "too-dark": "照片太暗了。試試明亮一點的地方再拍一次。",
  "side-face": "需要正面照才能準確試戴。請正對鏡頭拍一張。",
} as const;

type Reason = keyof typeof REASON_MESSAGES;

interface Props {
  reason: Reason;
  onRetake: () => void;
}

export function QualityError({ reason, onRetake }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 rounded-lg border-2 border-dashed border-destructive/40 bg-destructive/5 px-6 py-16 text-center">
      <div className="space-y-2 max-w-md">
        <h2 className="text-xl font-semibold">這張照片試戴不出來</h2>
        <p className="text-sm text-foreground/80">{REASON_MESSAGES[reason]}</p>
      </div>
      <Button size="lg" variant="secondary" onClick={onRetake}>
        重新選照片
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add nexbuy-web/src/app/tryon/components/QualityError.tsx
git commit -m "$(cat <<'EOF'
feat(tryon): QualityError component (retake prompt with reason)

Co-authored-by: Claude <claude@anthropic.com>
EOF
)"
```

---

## Task 10: TryOnCanvas component

**Files:**
- Create: `nexbuy-web/src/app/tryon/components/TryOnCanvas.tsx`

**Context:** The `<canvas>` element + render-on-change effect. Receives selfie, glasses, and placement as props; draws whenever they change.

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { renderTryOn } from "../lib/canvas-renderer";
import type { Placement } from "../lib/glasses-placer";

interface Props {
  selfie: ImageBitmap;
  glasses: HTMLImageElement | null;
  placement: Placement | null;
  /** Exposed so the parent can call canvas.toBlob for download. */
  canvasRef?: React.Ref<HTMLCanvasElement>;
}

export function TryOnCanvas({ selfie, glasses, placement, canvasRef }: Props) {
  const localRef = useRef<HTMLCanvasElement | null>(null);

  // Forward to parent ref
  useEffect(() => {
    if (!canvasRef) return;
    if (typeof canvasRef === "function") canvasRef(localRef.current);
    else (canvasRef as React.RefObject<HTMLCanvasElement | null>).current = localRef.current;
  }, [canvasRef]);

  useEffect(() => {
    const canvas = localRef.current;
    if (!canvas) return;

    // Match canvas resolution to selfie (preserves quality on download)
    canvas.width = selfie.width;
    canvas.height = selfie.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderTryOn({ ctx, canvas, selfie, glasses, placement });
  }, [selfie, glasses, placement]);

  return (
    <div className="relative w-full overflow-hidden rounded-lg bg-muted">
      <canvas
        ref={localRef}
        className="block w-full h-auto"
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add nexbuy-web/src/app/tryon/components/TryOnCanvas.tsx
git commit -m "$(cat <<'EOF'
feat(tryon): TryOnCanvas component (selfie + glasses compositing)

Co-authored-by: Claude <claude@anthropic.com>
EOF
)"
```

---

## Task 11: AdjustmentSliders component

**Files:**
- Create: `nexbuy-web/src/app/tryon/components/AdjustmentSliders.tsx`

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  type Adjustment,
  ADJUSTMENT_DEFAULTS,
  ADJUSTMENT_RANGES,
} from "../lib/glasses-placer";

interface Props {
  value: Adjustment;
  onChange: (next: Adjustment) => void;
}

export function AdjustmentSliders({ value, onChange }: Props) {
  const { widthScale, yOffset, angle } = ADJUSTMENT_RANGES;

  function patch(partial: Partial<Adjustment>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">微調</h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onChange(ADJUSTMENT_DEFAULTS)}
          className="h-7 text-xs"
        >
          重置
        </Button>
      </div>

      <SliderRow
        label="寬度"
        value={value.widthScale}
        min={widthScale.min}
        max={widthScale.max}
        step={widthScale.step}
        onChange={(v) => patch({ widthScale: v })}
      />
      <SliderRow
        label="高低"
        value={value.yOffset}
        min={yOffset.min}
        max={yOffset.max}
        step={yOffset.step}
        onChange={(v) => patch({ yOffset: v })}
      />
      <SliderRow
        label="角度"
        value={value.angle}
        min={angle.min}
        max={angle.max}
        step={angle.step}
        onChange={(v) => patch({ angle: v })}
      />
    </div>
  );
}

interface RowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}

function SliderRow({ label, value, min, max, step, onChange }: RowProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-10 shrink-0 text-xs text-muted-foreground">{label}</span>
      <Slider
        className="flex-1"
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add nexbuy-web/src/app/tryon/components/AdjustmentSliders.tsx
git commit -m "$(cat <<'EOF'
feat(tryon): AdjustmentSliders (width/y/angle + reset)

Co-authored-by: Claude <claude@anthropic.com>
EOF
)"
```

---

## Task 12: ProductCarousel component

**Files:**
- Create: `nexbuy-web/src/app/tryon/components/ProductCarousel.tsx`

**Context:** Horizontal-scrolling list of products. Each card shows product image + name. Active card has accent border. Click changes selection.

- [ ] **Step 1: Write the component**

```tsx
"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types/database";

interface Props {
  products: Product[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ProductCarousel({ products, selectedId, onSelect }: Props) {
  if (products.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        目前還沒有可試戴的款式
      </p>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <div className="flex gap-3 pb-2">
        {products.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            className={cn(
              "shrink-0 w-24 rounded-lg border-2 bg-card p-2 text-left transition",
              selectedId === p.id
                ? "border-primary"
                : "border-transparent hover:border-muted-foreground/30",
            )}
          >
            <div className="relative aspect-square overflow-hidden rounded bg-muted">
              {p.image_urls[0] && (
                <Image
                  src={p.image_urls[0]}
                  alt={p.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              )}
            </div>
            <p className="mt-1 line-clamp-2 text-xs">{p.name}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add nexbuy-web/src/app/tryon/components/ProductCarousel.tsx
git commit -m "$(cat <<'EOF'
feat(tryon): ProductCarousel (horizontal scroll with active highlight)

Co-authored-by: Claude <claude@anthropic.com>
EOF
)"
```

---

## Task 13: ActionBar component

**Files:**
- Create: `nexbuy-web/src/app/tryon/components/ActionBar.tsx`

**Context:** Shows price/name + CTAs. CTA depends on kind: `finished` → add to cart; `prescription_frame` → book appointment. Always shows download + detail.

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Download, ShoppingCart, Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types/database";
import { downloadCanvasAsPng } from "../lib/canvas-renderer";

interface Props {
  product: Product;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function ActionBar({ product, canvasRef }: Props) {
  const router = useRouter();
  const { add } = useCart();

  async function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const filename = `tryon-${product.slug}-${Date.now()}.png`;
    try {
      await downloadCanvasAsPng(canvas, filename);
    } catch (e) {
      console.error(e);
      alert("下載失敗,請重試");
    }
  }

  function handleAddToCart() {
    add({
      product_id: product.id,
      slug: product.slug,
      name: product.name,
      price_cents: product.price_cents,
      image_url: product.image_urls[0],
      quantity: 1,
    });
    router.push("/cart");
  }

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div>
        <p className="font-medium">{product.name}</p>
        <p className="text-sm text-muted-foreground">
          {formatPrice(product.price_cents)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="size-4 mr-1" />
          下載
        </Button>

        <Button asChild variant="outline" size="sm">
          <Link href={`/products/${product.slug}`}>
            <ExternalLink className="size-4 mr-1" />
            看詳情
          </Link>
        </Button>

        {product.kind === "finished" ? (
          <Button
            className="col-span-2"
            onClick={handleAddToCart}
            disabled={(product.finished_stock ?? 0) <= 0}
          >
            <ShoppingCart className="size-4 mr-1" />
            {(product.finished_stock ?? 0) <= 0 ? "已售完" : "加入購物車"}
          </Button>
        ) : (
          <Button asChild className="col-span-2">
            <Link href={`/appointment/book/${product.slug}`}>
              <Calendar className="size-4 mr-1" />
              預約到店配鏡
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Sanity check cart API**

The cart hook is `useCart()` from `@/lib/cart` and returns `{ add }`. `CartItem` requires `{ product_id, slug, name, price_cents, quantity, image_url? }`. Existing usage pattern: `nexbuy-web/src/app/products/[slug]/AddToCartButton.tsx`.

- [ ] **Step 3: Commit**

```bash
git add nexbuy-web/src/app/tryon/components/ActionBar.tsx
git commit -m "$(cat <<'EOF'
feat(tryon): ActionBar (download/cart/book/detail CTAs)

Co-authored-by: Claude <claude@anthropic.com>
EOF
)"
```

---

## Task 14: TryOnClient orchestrator

**Files:**
- Create: `nexbuy-web/src/app/tryon/TryOnClient.tsx`

**Context:** State machine orchestrator. Holds phase, selected product, adjustments. Renders the right UI per phase. Wires together all the components and lib functions.

- [ ] **Step 1: Write the orchestrator**

```tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SelfieUploader } from "./components/SelfieUploader";
import { QualityError } from "./components/QualityError";
import { TryOnCanvas } from "./components/TryOnCanvas";
import { ProductCarousel } from "./components/ProductCarousel";
import { AdjustmentSliders } from "./components/AdjustmentSliders";
import { ActionBar } from "./components/ActionBar";
import {
  detectFace,
  isMediaPipeSupported,
} from "./lib/face-detector";
import { computeAverageLuma } from "./lib/canvas-renderer";
import { checkQuality, type Landmark } from "./lib/quality-check";
import {
  computeBasePlacement,
  applyAdjustment,
  ADJUSTMENT_DEFAULTS,
  type Adjustment,
  type Placement,
} from "./lib/glasses-placer";
import type { Product } from "@/lib/types/database";

type Phase =
  | { kind: "idle" }
  | { kind: "analyzing" }
  | { kind: "quality-fail"; reason: "no-face" | "too-dark" | "side-face" }
  | {
      kind: "ready";
      selfie: ImageBitmap;
      landmarks: Landmark[];
      glassesAspect: { naturalWidth: number; naturalHeight: number };
      glassesImage: HTMLImageElement;
    };

interface Props {
  products: Product[];
}

export function TryOnClient({ products }: Props) {
  const searchParams = useSearchParams();
  const querySlug = searchParams.get("product");

  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (querySlug) {
      const found = products.find((p) => p.slug === querySlug);
      if (found) return found.id;
    }
    return products[0]?.id ?? null;
  });
  const [adjust, setAdjust] = useState<Adjustment>(ADJUSTMENT_DEFAULTS);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedId) ?? null,
    [products, selectedId],
  );

  // When the product changes, reset sliders AND reload the glasses image so
  // placement recomputes with the new PNG's aspect.
  useEffect(() => {
    setAdjust(ADJUSTMENT_DEFAULTS);
    if (phase.kind !== "ready") return;
    if (!selectedProduct?.try_on_image_url) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = selectedProduct.try_on_image_url;
    img.onload = () => {
      setPhase((p) =>
        p.kind === "ready"
          ? {
              ...p,
              glassesImage: img,
              glassesAspect: {
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
              },
            }
          : p,
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  async function handleFile(file: File) {
    if (!isMediaPipeSupported()) {
      alert("您的瀏覽器不支援試戴功能,可瀏覽商品或預約到店");
      return;
    }
    setPhase({ kind: "analyzing" });

    try {
      // Resize to max 1280px on longest side
      const tmp = await createImageBitmap(file);
      const scale = Math.min(1, 1280 / Math.max(tmp.width, tmp.height));
      const selfie =
        scale < 1
          ? await createImageBitmap(file, {
              resizeWidth: Math.round(tmp.width * scale),
              resizeHeight: Math.round(tmp.height * scale),
            })
          : tmp;

      const landmarks = (await detectFace(selfie)) as Landmark[];
      const luma = computeAverageLuma(selfie);
      const quality = checkQuality(landmarks, luma);
      if (!quality.ok) {
        setPhase({ kind: "quality-fail", reason: quality.reason });
        return;
      }

      // Pre-load the current product's glasses PNG so READY has it ready
      if (!selectedProduct?.try_on_image_url) {
        // No glasses to overlay yet — still go to READY so user can switch.
        // Will render selfie-only until they pick.
        setPhase({
          kind: "ready",
          selfie,
          landmarks,
          glassesAspect: { naturalWidth: 1, naturalHeight: 1 },
          glassesImage: new Image(),
        });
        return;
      }
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = selectedProduct.try_on_image_url;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("glasses load failed"));
      });

      setPhase({
        kind: "ready",
        selfie,
        landmarks,
        glassesAspect: {
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
        },
        glassesImage: img,
      });
    } catch (e) {
      console.error("try-on analysis failed:", e);
      alert("無法處理這張圖片,請換一張");
      setPhase({ kind: "idle" });
    }
  }

  const placement = useMemo<Placement | null>(() => {
    if (phase.kind !== "ready") return null;
    if (!phase.glassesImage.complete || phase.glassesImage.naturalWidth === 0) {
      return null;
    }
    const base = computeBasePlacement(
      phase.landmarks,
      phase.glassesAspect,
      { width: phase.selfie.width, height: phase.selfie.height },
    );
    return applyAdjustment(base, adjust, phase.selfie.height);
  }, [phase, adjust]);

  if (phase.kind === "idle") {
    return (
      <SelfieUploader
        onFile={handleFile}
        onError={(msg) => alert(msg)}
      />
    );
  }

  if (phase.kind === "analyzing") {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">分析中…</p>
      </div>
    );
  }

  if (phase.kind === "quality-fail") {
    return (
      <QualityError
        reason={phase.reason}
        onRetake={() => setPhase({ kind: "idle" })}
      />
    );
  }

  // READY
  return (
    <div className="space-y-4">
      <TryOnCanvas
        selfie={phase.selfie}
        glasses={phase.glassesImage.complete ? phase.glassesImage : null}
        placement={placement}
        canvasRef={canvasRef}
      />

      <ProductCarousel
        products={products}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      <AdjustmentSliders value={adjust} onChange={setAdjust} />

      {selectedProduct && (
        <ActionBar product={selectedProduct} canvasRef={canvasRef} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Fix any type errors. The `Landmark` type returned from MediaPipe (`NormalizedLandmark`) should be structurally compatible with our local `Landmark` interface (`{ x, y, z }`); cast if necessary.

- [ ] **Step 3: Commit**

```bash
git add nexbuy-web/src/app/tryon/TryOnClient.tsx
git commit -m "$(cat <<'EOF'
feat(tryon): TryOnClient orchestrator (state machine + composition)

Co-authored-by: Claude <claude@anthropic.com>
EOF
)"
```

---

## Task 15: /tryon/page.tsx (RSC)

**Files:**
- Create: `nexbuy-web/src/app/tryon/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
import { Suspense } from "react";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Product } from "@/lib/types/database";
import { TryOnClient } from "./TryOnClient";

export const metadata = {
  title: "虛擬試戴 | Nexbuy",
  description: "上傳一張正面自拍,看眼鏡商品戴在你臉上的效果。",
};

export default async function TryOnPage() {
  const sb = await createServerSupabase();
  const { data, error } = await sb
    .from("products")
    .select(
      "id, slug, name, description, price_cents, image_urls, brand, kind, finished_stock, is_online_available, try_on_image_url",
    )
    .not("try_on_image_url", "is", null)
    .eq("is_online_available", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("tryon page load failed:", error);
    throw new Error("Failed to load products");
  }

  const products = (data ?? []) as Product[];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <header className="mb-6">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          虛擬試戴
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          上傳一張正面自拍,選一副眼鏡看試戴效果。
        </p>
      </header>

      <Suspense fallback={<p className="text-muted-foreground">載入中…</p>}>
        <TryOnClient products={products} />
      </Suspense>
    </div>
  );
}
```

- [ ] **Step 2: Run dev server, smoke test**

```bash
cd nexbuy-web
pnpm dev
```

Visit `http://localhost:3000/tryon`. Expected:
- Page loads with header + uploader empty state
- No console errors

(At this point no products have `try_on_image_url` set — the carousel will be empty after upload. That's expected; Task 16 makes it possible to populate.)

- [ ] **Step 3: Commit**

```bash
git add nexbuy-web/src/app/tryon/page.tsx
git commit -m "$(cat <<'EOF'
feat(tryon): /tryon RSC page (fetches products with try_on_image_url)

Co-authored-by: Claude <claude@anthropic.com>
EOF
)"
```

---

## Task 16: Admin upload UI

**Files:**
- Modify: `nexbuy-web/src/app/admin/(protected)/products/ProductForm.tsx`
- Modify: `nexbuy-web/src/app/admin/(protected)/products/actions.ts`
- Modify: `nexbuy-web/src/app/admin/(protected)/products/[id]/edit/page.tsx`
- Modify: `nexbuy-web/src/app/admin/(protected)/products/new/page.tsx`

**Context:** PR #28fac29 already implemented this. The pattern:
1. Parameterize `uploadImageIfPresent` → `uploadIfPresent(bucket, formField, allowedTypes, slug)`
2. Two thin wrappers: `uploadProductImage(...)` (existing behavior), `uploadTryOnImage(...)` (PNG-only, `try-on-images` bucket)
3. ProductForm: add a second upload field for "試戴用透明 PNG", `accept="image/png"`, with checker-pattern preview to highlight transparency

Reference the original commit if needed:

```bash
git show 28fac29 -- nexbuy-web/src/app/admin/\(protected\)/products/
```

But don't copy-paste blindly — the actions.ts has changed since (added `face_shape`, `frame_shape`, `low_stock_threshold` etc.). Re-apply the try-on changes on top of current code.

- [ ] **Step 1: Refactor uploadImageIfPresent → uploadIfPresent**

In `nexbuy-web/src/app/admin/(protected)/products/actions.ts`, replace the existing `uploadImageIfPresent` function (around lines 40-73) with:

```typescript
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const PRODUCT_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const TRY_ON_IMAGE_TYPES = new Set(["image/png"]);

/**
 * Upload an optional file to the given bucket. Returns the public URL or null
 * if no file given. Throws on validation / upload failure.
 */
async function uploadIfPresent(
  formData: FormData,
  formField: string,
  bucket: "product-images" | "try-on-images",
  allowedTypes: Set<string>,
  slug: string,
): Promise<string | null> {
  const file = formData.get(formField);
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("圖片超過 5MB");
  }
  if (!allowedTypes.has(file.type)) {
    throw new Error(
      bucket === "try-on-images"
        ? "試戴圖只支援 PNG"
        : "圖片格式只支援 JPG / PNG / WebP",
    );
  }

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";
  const path = `${slug}/${Date.now()}.${ext}`;

  const admin = createAdminSupabase();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage
    .from(bucket)
    .upload(path, buffer, { contentType: file.type, upsert: false });
  if (error) {
    console.error(`storage upload to ${bucket} failed:`, error);
    throw new Error("圖片上傳失敗");
  }

  const { data } = admin.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

function uploadProductImage(formData: FormData, slug: string) {
  return uploadIfPresent(formData, "image", "product-images", PRODUCT_IMAGE_TYPES, slug);
}

function uploadTryOnImage(formData: FormData, slug: string) {
  return uploadIfPresent(formData, "try_on_image", "try-on-images", TRY_ON_IMAGE_TYPES, slug);
}
```

Delete the constants `MAX_FILE_BYTES` and `ALLOWED_TYPES` from earlier in the file (they're now merged in).

- [ ] **Step 2: Wire createProductAction**

In `createProductAction` (around lines 75-121), replace the image upload block:

```typescript
  let imageUrl: string | null = null;
  let tryOnUrl: string | null = null;
  try {
    imageUrl = await uploadProductImage(formData, parsed.data.slug);
    tryOnUrl = await uploadTryOnImage(formData, parsed.data.slug);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "上傳失敗" };
  }
```

Then in the `.insert({...})` call, add:

```typescript
    image_urls: imageUrl ? [imageUrl] : [],
    try_on_image_url: tryOnUrl,
```

- [ ] **Step 3: Wire updateProductAction**

Read the existing product to preserve `try_on_image_url` when no new file is uploaded:

```typescript
  const { data: existing, error: readErr } = await sb
    .from("products")
    .select("image_urls, try_on_image_url")
    .eq("id", productId)
    .maybeSingle();
```

In the image-upload section, parallel the product image logic:

```typescript
  let imageUrls: string[] = (existing.image_urls as string[] | null) ?? [];
  let tryOnUrl: string | null = (existing.try_on_image_url as string | null) ?? null;
  try {
    const newUrl = await uploadProductImage(formData, parsed.data.slug);
    if (newUrl) {
      imageUrls = [newUrl, ...imageUrls.filter((u) => u !== newUrl)];
    }
    const newTryOn = await uploadTryOnImage(formData, parsed.data.slug);
    if (newTryOn) tryOnUrl = newTryOn;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "上傳失敗" };
  }
```

In the `.update({...})` call, add:

```typescript
      image_urls: imageUrls,
      try_on_image_url: tryOnUrl,
```

Also add `revalidatePath("/tryon");` after the existing revalidate calls.

- [ ] **Step 4: Add the upload field to ProductForm**

In `nexbuy-web/src/app/admin/(protected)/products/ProductForm.tsx`:

1. Add `try_on_image_url: string | null;` to the `ProductInitial` interface (around line 38).

2. Just after the existing 商品圖 upload block (after the `</div>` that closes the product-image div, around line 280+), add a new section:

```tsx
      <div className="space-y-2">
        <Label htmlFor="p-tryon-image">
          試戴用透明 PNG（選填）
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            — 必須是已去背的 PNG，會出現在 /tryon
          </span>
        </Label>
        {initial.try_on_image_url && (
          <div
            className="flex items-center gap-3"
            style={{
              // CSS checker pattern to highlight transparency in preview
              backgroundImage:
                "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
              backgroundSize: "16px 16px",
              backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
            }}
          >
            <Image
              src={initial.try_on_image_url}
              alt="目前試戴圖"
              width={120}
              height={60}
              className="rounded"
              unoptimized
            />
            <p className="text-sm text-muted-foreground">
              已有試戴圖。選新檔案會置換。
            </p>
          </div>
        )}
        <Input
          id="p-tryon-image"
          type="file"
          name="try_on_image"
          accept="image/png"
        />
        <p className="text-xs text-muted-foreground">
          請用 Photoshop / Photopea / Photoroom 等工具先把眼鏡去背成透明 PNG 再上傳。
          建議：眼鏡置中、無陰影、解析度 ≥ 800px。
        </p>
      </div>
```

- [ ] **Step 5: Update edit + new page**

In `nexbuy-web/src/app/admin/(protected)/products/[id]/edit/page.tsx`, add `try_on_image_url` to the SELECT list and pass it in `initial`:

```typescript
    .select(
      "id, name, slug, description, brand, price_cents, kind, finished_stock, low_stock_threshold, is_online_available, image_urls, face_shape, frame_shape, frame_size, material, color, try_on_image_url",
    )
```

(Preserve the existing columns; just add `try_on_image_url` at the end.)

The `initial` object building:

```typescript
  const initial = {
    ...data,
    image_urls: (data.image_urls as string[] | null) ?? [],
    try_on_image_url: (data.try_on_image_url as string | null) ?? null,
  } as ProductInitial;
```

In `nexbuy-web/src/app/admin/(protected)/products/new/page.tsx`, ensure the empty initial has `try_on_image_url: null`.

- [ ] **Step 6: Typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 7: Manually test admin upload**

```bash
pnpm dev
```

1. Log in to `/admin`, go to a product edit page
2. Upload a transparent test PNG (you can make a simple 200x80 PNG with transparent background)
3. Save
4. Visit `/tryon` — that product should now appear in the carousel after uploading any selfie

- [ ] **Step 8: Commit**

```bash
git add nexbuy-web/src/app/admin
git commit -m "$(cat <<'EOF'
feat(tryon): admin can upload transparent try-on PNG per product

- ProductForm: 「試戴用透明 PNG」欄位 + 棋盤背景 preview
- actions.ts: uploadIfPresent 抽象化、create/update 同步存 try_on_image_url
- edit/new 頁帶 try_on_image_url 進 initial
- update 時 revalidate /tryon

Co-authored-by: Claude <claude@anthropic.com>
EOF
)"
```

---

## Task 17: Product detail page — virtual try-on link

**Files:**
- Modify: `nexbuy-web/src/app/products/[slug]/page.tsx`

- [ ] **Step 1: Add try_on_image_url to SELECT**

Find the `.select(...)` call (currently around line 22). Add `try_on_image_url` to the column list:

```typescript
    .select(
      "id, slug, name, description, price_cents, image_urls, brand, kind, finished_stock, is_online_available, try_on_image_url",
    )
```

- [ ] **Step 2: Add the link below the existing CTA**

After the existing CTA block (the "預約到店配鏡" Link or "AddToCartButton"), add:

```tsx
            {product.try_on_image_url && (
              <Link
                href={`/tryon?product=${product.slug}`}
                className={buttonVariants({
                  variant: "outline",
                  size: "lg",
                  className: "w-full sm:w-auto",
                })}
              >
                虛擬試戴
              </Link>
            )}
```

Place it inside the same `<div className="space-y-2">` that wraps the existing CTA, so it stacks naturally on mobile.

- [ ] **Step 3: Smoke test**

```bash
pnpm dev
```

Visit a product detail page for a product that has `try_on_image_url` set. Click "虛擬試戴" → should navigate to `/tryon?product=<slug>` with that product highlighted.

Visit one without `try_on_image_url` set → button should not appear.

- [ ] **Step 4: Commit**

```bash
git add nexbuy-web/src/app/products/[slug]/page.tsx
git commit -m "$(cat <<'EOF'
feat(tryon): product detail page links to /tryon when try_on PNG exists

Co-authored-by: Claude <claude@anthropic.com>
EOF
)"
```

---

## Task 18: Header navigation link

**Files:**
- Modify: `nexbuy-web/src/components/site/Header.tsx`

- [ ] **Step 1: Read current Header**

```bash
cat nexbuy-web/src/components/site/Header.tsx
```

Note the existing nav structure (likely an array of `{ href, label }` items or inline `<Link>` components).

- [ ] **Step 2: Add "試戴" link**

Insert a `<Link href="/tryon">試戴</Link>` (matching the style of existing nav links) right after the existing "商品" / `/products` link. If the header uses a mobile hamburger menu (likely), make sure the new link appears in that menu too.

Example (adapt to actual current code):

```tsx
<Link href="/products">商品</Link>
<Link href="/tryon">試戴</Link>
```

- [ ] **Step 3: Smoke test**

```bash
pnpm dev
```

Visit any page, confirm "試戴" appears in the nav and clicks through to `/tryon`. Also check mobile layout (DevTools responsive mode at 375px).

- [ ] **Step 4: Commit**

```bash
git add nexbuy-web/src/components/site/Header.tsx
git commit -m "$(cat <<'EOF'
feat(tryon): add 試戴 link to main navigation

Co-authored-by: Claude <claude@anthropic.com>
EOF
)"
```

---

## Task 19: Documentation updates

**Files:**
- Modify: `docs/operating-manual-admin.md`
- Modify: `docs/operating-manual-customer.md`

- [ ] **Step 1: Read current admin manual structure**

```bash
grep -n "^## " docs/operating-manual-admin.md
```

Identify the section right after商品管理 (or the product upload section). The new content goes there.

- [ ] **Step 2: Add admin section**

Insert after the商品管理 section (preserve the surrounding heading numbering — adjust if needed):

```markdown
### 試戴專用透明 PNG

新欄位「試戴用透明 PNG」是給 `/tryon` 虛擬試戴功能用的眼鏡剪影圖。**和商品主圖不同**，主圖是給商品列表/詳情頁，試戴圖只能是透明背景 PNG。

**為什麼分開**：商品主圖通常有品牌背景或情境，貼到顧客臉上會穿幫；試戴圖必須只剩眼鏡本身、其他都透明。

**怎麼準備這張圖**：

推薦工具（擇一即可）：
- [Photoroom](https://photoroom.com/)（網頁版有免費 tier，眼鏡品質佳）
- [Pixelcut](https://pixelcut.ai/)（同樣免費可用）
- [Photopea](https://photopea.com/)（免費、像 Photoshop、可手動修飾）

步驟：
1. 把眼鏡商品圖丟進去背工具
2. 確認去背結果：放大檢查鏡腳、鏡架邊緣有沒有殘留底色
3. 匯出為 **透明 PNG**（不是白底 PNG！）
4. 建議解析度 ≥ 800px 寬、眼鏡置中、無陰影

**怎麼上傳**：

1. 後台 → 商品 → 點要更新的商品
2. 滑到「試戴用透明 PNG」欄位
3. 選檔案、儲存
4. 開新分頁前往 `/tryon`、上傳一張正面自拍、點該商品 → 確認試戴效果

**沒上傳的商品**：不會出現在 `/tryon`。可以漸進補上，不是必填。

**檔案限制**：PNG only、5MB 內。
```

- [ ] **Step 3: Add customer manual section**

Read current structure:

```bash
grep -n "^## " docs/operating-manual-customer.md
```

Insert a new section (typically after「瀏覽商品」、編號接續）：

```markdown
## 虛擬試戴

想知道某副眼鏡戴在自己臉上會是什麼樣子？我們提供線上虛擬試戴。

### 怎麼用

1. **進入試戴頁**：上方選單點「試戴」，或在任何商品詳情頁點「虛擬試戴」按鈕
2. **上傳自拍**：點「選照片」、從相簿選一張正面自拍
   - 拍照訣竅：明亮的地方、五官清楚、正對鏡頭
   - 戴帽子、墨鏡、口罩會影響辨識
3. **選眼鏡**：照片下方有商品列表、左右滑切換
4. **微調**（可選）：用三個滑桿調寬度、上下、角度，找到最自然的位置
5. **接著可以**：
   - 下載試戴圖（傳給朋友看意見）
   - 直接加入購物車（成品太陽眼鏡）
   - 預約到店配鏡（處方鏡架）
   - 看商品詳細介紹

### 隱私說明

**你的自拍照不會上傳到我們的伺服器**。整個試戴過程都在你的瀏覽器內完成、關掉分頁就消失。我們看不到、也不會儲存。

### 拍不出好結果？

如果系統提示「找不到你的臉」、「太暗」或「需要正面照」：

- 找個明亮的地方再拍一次
- 正對鏡頭、不要低頭也不要側臉
- 把頭髮撥開、露出整個臉

平面眼鏡疊圖技術限制：側臉、誇張表情、被頭髮蓋住的位置疊起來會不準。我們選擇先擋下這些照片、避免讓你看到怪怪的結果。
```

- [ ] **Step 4: Commit**

```bash
git add docs/operating-manual-admin.md docs/operating-manual-customer.md
git commit -m "$(cat <<'EOF'
docs(tryon): admin + customer manuals — virtual try-on usage

Co-authored-by: Claude <claude@anthropic.com>
EOF
)"
```

---

## Task 20: Full QA pass

**Files:** none (verification only)

- [ ] **Step 1: Reset local DB + seed test data**

```bash
cd nexbuy-web
supabase db reset
```

Then in admin UI, upload a transparent PNG for at least 2 products (one `finished`, one `prescription_frame`).

- [ ] **Step 2: Run automated tests**

```bash
pnpm test
pnpm typecheck
pnpm lint
```

All three must pass.

- [ ] **Step 3: Manual QA — upload edge cases**

Test on `pnpm dev` localhost:

| Case | Expected |
|------|---------|
| 正面亮光自拍 | 進入 READY 狀態、看到試戴疊圖 |
| 側臉照 | 「需要正面照」訊息、不顯示試戴 |
| 全黑圖 | 「太暗」訊息 |
| 風景照（無臉）| 「找不到臉」訊息 |
| .pdf 改名 .jpg | 「無法處理」或「不是圖片」訊息、不 crash |
| 12 MB 巨檔 | 「圖片太大」、不上傳 |

- [ ] **Step 4: Manual QA — interactions**

| Case | Expected |
|------|---------|
| 點 carousel 第二副 | 滑桿重置、新眼鏡疊上去 |
| 拉「寬度」滑桿 | 眼鏡變寬/窄、cx/cy/angle 不變 |
| 拉「高低」滑桿 | 眼鏡上下移動 |
| 拉「角度」滑桿 | 眼鏡旋轉 |
| 「重置」按鈕 | 三個滑桿回到中間 |

- [ ] **Step 5: Manual QA — CTAs**

| Case | Expected |
|------|---------|
| 下載（成品）| 存到 `tryon-{slug}-{timestamp}.png` |
| 下載圖打開檢視 | 看到自拍 + 眼鏡合成、透明背景被合成完成 |
| 加入購物車（成品）| 跳購物車頁、品項在內 |
| 預約到店（處方）| 跳 `/appointment/book/[slug]` |
| 看詳情 | 跳 `/products/[slug]` |

- [ ] **Step 6: Manual QA — entry points**

| Case | Expected |
|------|---------|
| 主導覽「試戴」連結 | 跳 `/tryon` |
| 商品詳情頁「虛擬試戴」 | 跳 `/tryon?product=xxx`、自動 highlight 該商品 |
| `/tryon` 沒上傳前 | 空狀態 + 上傳引導 + 隱私提示 |

- [ ] **Step 7: Manual QA — devices**

Open `pnpm dev` URL on phone (LAN IP) and test:
- iOS Safari 自拍上傳流程
- Android Chrome 自拍上傳流程
- desktop Chrome 320px 寬不破版

- [ ] **Step 8: Performance check**

In DevTools Network tab, hard-refresh `/tryon`:
- HTML response: TTFB < 300ms warm (after 2-3 refreshes)
- First file pick → READY phase: < 5s on a typical desktop

- [ ] **Step 9: Final commit if anything fixed during QA**

If you fixed bugs during QA, commit them as separate commits (one fix per commit). If no bugs, no commit.

---

## Task 21: Open PR

**Files:** none (git op only)

- [ ] **Step 1: Verify branch is clean and pushed up to date**

```bash
git status
git log --oneline -20
```

Expected: working tree clean, ~20 commits since dev's HEAD.

- [ ] **Step 2: Push branch**

```bash
git push -u origin feat/virtual-tryon
```

- [ ] **Step 3: Open PR to dev (NOT main per CLAUDE.md)**

```bash
gh pr create --base dev --title "feat: 虛擬試戴 /tryon (Phase 2 重啟)" --body "$(cat <<'EOF'
## Summary

Phase 2 虛擬試戴重啟。前一版（PR #28fac29 + #2eafad9）因 remove.bg 自動去背品質問題在 5547e78 被撤回；這次改採 admin 手動去背、避開自動化的失控點。

**範疇**：
- 獨立 `/tryon` 頁，瀏覽器端 MediaPipe Face Landmarker 偵測 + Canvas 2D 疊圖
- 自拍照完全留在瀏覽器、不上傳 server（隱私）
- 三滑桿微調（寬度 / 高低 / 角度）
- CTA：下載 PNG / 加購物車 / 預約 / 看詳情
- 嚴格 quality gate（無臉 / 太暗 / 側臉 → 擋下）
- Admin 後台「試戴用透明 PNG」上傳欄位
- Operating manuals 補上對應章節

**設計文件**：`docs/superpowers/specs/2026-05-16-virtual-tryon-design.md`
**實作計畫**：`docs/superpowers/plans/2026-05-16-virtual-tryon.md`

## Test plan

- [ ] `pnpm test` 全部通過（含 11 個新 unit test：quality-check + glasses-placer）
- [ ] `pnpm typecheck` 通過
- [ ] `pnpm lint` 通過
- [ ] 手動 QA：正面照成功試戴、側臉/暗光/無臉被擋下
- [ ] 手動 QA：切款、三滑桿、重置、四種 CTA 全部運作
- [ ] 手動 QA：iOS Safari + Android Chrome 各跑一次
- [ ] 手動 QA：Admin 上傳透明 PNG → `/tryon` 立即可見
- [ ] Perf：`/tryon` warm TTFB < 300ms

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 4: Return PR URL**

The `gh pr create` output includes the PR URL. Confirm it appears and share with the user.

---

## Plan summary

20 tasks, ~150 steps total. Roughly:

- Tasks 1-3: Setup & schema (small, foundational)
- Tasks 4-7: Pure libs (TDD where possible)
- Tasks 8-15: UI components + page composition
- Task 16: Admin upload UI (largest single task — resurrecting work from #28fac29)
- Tasks 17-18: Integration links
- Task 19: Documentation
- Tasks 20-21: QA + PR

Each numbered task ends with a commit, so the PR history is incremental and reviewable. Total estimated implementation time: 6-10 hours for a familiar engineer, longer if MediaPipe quirks need debugging.
