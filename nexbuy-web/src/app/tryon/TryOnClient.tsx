"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SelfieUploader } from "./components/SelfieUploader";
import { QualityError } from "./components/QualityError";
import { TryOnCanvas } from "./components/TryOnCanvas";
import { ProductCarousel } from "./components/ProductCarousel";
import { AdjustmentSliders } from "./components/AdjustmentSliders";
import { ActionBar } from "./components/ActionBar";
import { FilterBar, DEFAULT_FILTERS, applyFilters, type Filters } from "./components/FilterBar";
import { MobileFilterButton } from "./components/MobileFilterButton";
import { FaceShapeSelector } from "./components/FaceShapeSelector";
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
import { scoreProduct, type FaceShape } from "./lib/face-recommendations";
import { FACE_SHAPES } from "@/lib/schemas/product";
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
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [faceShape, setFaceShape] = useState<FaceShape | null>(null);

  // Auto-load face shape from quiz result saved in localStorage.
  useEffect(() => {
    const saved = localStorage.getItem("nb:faceShape");
    if (saved && (FACE_SHAPES as readonly string[]).includes(saved)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFaceShape(saved as FaceShape);
    }
  }, []);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedId) ?? null,
    [products, selectedId],
  );

  // The product the user originally arrived with (from ?product=slug on
  // the product page). Captured once so that clicking other thumbnails
  // afterwards doesn't keep reordering the carousel.
  const initialSelectedIdRef = useRef(selectedId);

  const displayedProducts = useMemo(() => {
    const filtered = applyFilters(products, filters);
    let sorted = faceShape
      ? [...filtered].sort(
          (a, b) => scoreProduct(b, faceShape) - scoreProduct(a, faceShape),
        )
      : filtered;
    // Bring the originally-selected product (from URL) to the front so the
    // active highlight in the carousel is the leftmost item.
    const initialId = initialSelectedIdRef.current;
    if (initialId) {
      const idx = sorted.findIndex((p) => p.id === initialId);
      if (idx > 0) {
        sorted = [sorted[idx], ...sorted.slice(0, idx), ...sorted.slice(idx + 1)];
      }
    }
    return sorted;
  }, [products, filters, faceShape]);

  useEffect(() => {
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
    img.onerror = () => {
      console.error("glasses PNG load failed:", selectedProduct.try_on_image_url);
      setPhase((p) =>
        p.kind === "ready"
          ? {
              ...p,
              glassesImage: new Image(),
              glassesAspect: { naturalWidth: 1, naturalHeight: 1 },
            }
          : p,
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  function handleProductSelect(id: string) {
    // Keep the current adjustment values — once a user has dialled in the
    // glasses-to-face fit (size / vertical / angle), that applies to other
    // frames too. Reset is still available via the explicit "重置" button.
    setSelectedId(id);
  }

  async function handleFile(file: File) {
    if (!isMediaPipeSupported()) {
      alert("您的瀏覽器不支援試戴功能,可瀏覽商品或預約到店");
      return;
    }
    setPhase({ kind: "analyzing" });

    try {
      const tmp = await createImageBitmap(file);
      const scale = Math.min(1, 1280 / Math.max(tmp.width, tmp.height));
      const selfie =
        scale < 1
          ? await createImageBitmap(file, {
              resizeWidth: Math.round(tmp.width * scale),
              resizeHeight: Math.round(tmp.height * scale),
            })
          : tmp;

      const raw = await detectFace(selfie);
      const landmarks: Landmark[] = raw.map((l) => ({
        x: l.x,
        y: l.y,
        z: l.z ?? 0,
      }));
      const luma = computeAverageLuma(selfie);
      const quality = checkQuality(landmarks, luma);
      if (!quality.ok) {
        setPhase({ kind: "quality-fail", reason: quality.reason });
        return;
      }

      if (!selectedProduct?.try_on_image_url) {
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
      <div className="mx-auto max-w-2xl">
        <SelfieUploader
          onFile={handleFile}
          onError={(msg) => alert(msg)}
        />
      </div>
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
      <div className="mx-auto max-w-2xl">
        <QualityError
          reason={phase.reason}
          onRetake={() => setPhase({ kind: "idle" })}
        />
      </div>
    );
  }

  // READY layout
  //
  // Mobile (single column, DOM order = visual order):
  //   1. FaceShape   ── filter the carousel by face type (top-priority controls)
  //   2. Filter      ── (mobile: dialog button; desktop: inline)
  //   3. Canvas      ── the try-on result
  //   4. Carousel    ── switch frames
  //   5. Sliders     ── fine-tune position/size
  //   6. ActionBar   ── add-to-cart / appointment CTA (below fold OK; user
  //                     reaches it after they're happy with the try-on)
  //
  // Desktop (lg+): 4-row × 2-col grid, canvas spans rows 1-3 in left col,
  //   carousel in left col row 4, action/face/filter stacked in right col
  //   rows 1-3, sliders in right col row 4. Grid placement overrides the
  //   mobile DOM order so the desktop layout stays the same.
  return (
    <div
      className="
        flex flex-col gap-3
        lg:grid
        lg:grid-cols-[minmax(0,1fr)_22rem]
        lg:grid-rows-[1fr_auto_auto_auto]
        lg:gap-x-5 lg:gap-y-3
        lg:h-[min(70vh,620px)]
      "
    >
      {/* 1. FaceShape — mobile top, desktop right col row 2 */}
      <div className="lg:col-start-2 lg:row-start-2">
        <FaceShapeSelector value={faceShape} onChange={setFaceShape} />
      </div>

      {/* 2. Filter — mobile 2nd, desktop right col row 3 */}
      <div className="lg:col-start-2 lg:row-start-3">
        <div className="lg:hidden">
          <MobileFilterButton
            products={products}
            value={filters}
            onChange={setFilters}
          />
        </div>
        <div className="hidden lg:block">
          <FilterBar
            products={products}
            value={filters}
            onChange={setFilters}
          />
        </div>
      </div>

      {/* 3. Canvas — mobile 3rd, desktop col 1 rows 1-3 (fills tall) */}
      <TryOnCanvas
        selfie={phase.selfie}
        glasses={phase.glassesImage.complete ? phase.glassesImage : null}
        placement={placement}
        canvasRef={canvasRef}
        className="h-64 sm:h-80 lg:h-auto lg:min-h-0 lg:col-start-1 lg:row-start-1 lg:row-end-4"
        onReplaceFile={handleFile}
        onError={(msg) => alert(msg)}
      />

      {/* 4. Carousel — mobile 4th, desktop col 1 row 4 */}
      <div className="shrink-0 lg:col-start-1 lg:row-start-4">
        <ProductCarousel
          products={displayedProducts}
          selectedId={selectedId}
          onSelect={handleProductSelect}
        />
      </div>

      {/* 5. Sliders — mobile 5th, desktop col 2 row 4 */}
      <div className="lg:col-start-2 lg:row-start-4">
        <AdjustmentSliders value={adjust} onChange={setAdjust} />
      </div>

      {/* 6. ActionBar — mobile 6th (CTA after try-on), desktop right col row 1 */}
      {selectedProduct && (
        <div className="lg:col-start-2 lg:row-start-1">
          <ActionBar product={selectedProduct} canvasRef={canvasRef} />
        </div>
      )}
    </div>
  );
}
