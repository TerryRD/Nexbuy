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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedId) ?? null,
    [products, selectedId],
  );

  const displayedProducts = useMemo(() => {
    const filtered = applyFilters(products, filters);
    if (!faceShape) return filtered;
    return [...filtered].sort(
      (a, b) => scoreProduct(b, faceShape) - scoreProduct(a, faceShape),
    );
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
    setSelectedId(id);
    setAdjust(ADJUSTMENT_DEFAULTS);
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
  // Desktop: two fixed-height columns, right panel scrolls independently.
  // Mobile: stacked — carousel + action bar appear first (most important),
  //         then face shape, filters, and sliders below.
  return (
    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[1fr_22rem] lg:h-[min(65vh,540px)] lg:gap-4">

      {/* ── Left: canvas ── */}
      <div className="flex flex-col gap-2 lg:min-h-0">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setPhase({ kind: "idle" })}
            className="text-sm text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
          >
            ← 換一張照片
          </button>
        </div>
        {/* Canvas fills remaining height on desktop; fixed height on mobile */}
        <TryOnCanvas
          selfie={phase.selfie}
          glasses={phase.glassesImage.complete ? phase.glassesImage : null}
          placement={placement}
          canvasRef={canvasRef}
          className="h-64 sm:h-80 lg:flex-1 lg:h-auto"
        />
      </div>

      {/* ── Right: controls ── */}
      {/* On desktop this panel scrolls independently so the page never scrolls. */}
      {/* On mobile, controls stack below the canvas in priority order. */}
      <div className="flex flex-col gap-3 lg:overflow-y-auto lg:min-h-0">

        {/* 1. Carousel — most interactive, visible first on mobile & desktop */}
        <ProductCarousel
          products={displayedProducts}
          selectedId={selectedId}
          onSelect={handleProductSelect}
        />

        {/* 2. Action bar — primary CTA visible without scrolling */}
        {selectedProduct && (
          <ActionBar product={selectedProduct} canvasRef={canvasRef} />
        )}

        {/* 3. Face shape selector */}
        <FaceShapeSelector value={faceShape} onChange={setFaceShape} />

        {/* 4. Filters */}
        <FilterBar
          products={products}
          value={filters}
          onChange={setFilters}
        />

        {/* 5. Fine-tune sliders — secondary, at bottom of right panel */}
        <AdjustmentSliders value={adjust} onChange={setAdjust} />
      </div>
    </div>
  );
}
