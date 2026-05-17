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
  // Mobile (default, single column): the DOM order below is the on-screen
  // order. Canvas → Carousel → Sliders comes first so all three primary
  // controls (see, switch frame, fine-tune) fit on one screen without
  // scrolling. ActionBar / FaceShape / Filter sit below the fold.
  //
  // Desktop (lg+): a 2×2 grid puts canvas (top-left, fills), carousel
  // (bottom-left), the action/face/filter group (top-right, scrolls
  // internally if tall), and sliders (bottom-right). Grid item placement
  // overrides the mobile DOM order.
  return (
    <div
      className="
        flex flex-col gap-3
        lg:grid
        lg:grid-cols-[minmax(0,1fr)_22rem]
        lg:grid-rows-[1fr_auto]
        lg:gap-x-5 lg:gap-y-3
        lg:h-[min(70vh,620px)]
      "
    >
      {/* 1. Canvas — mobile 1st, desktop top-left */}
      <TryOnCanvas
        selfie={phase.selfie}
        glasses={phase.glassesImage.complete ? phase.glassesImage : null}
        placement={placement}
        canvasRef={canvasRef}
        className="h-64 sm:h-80 lg:h-auto lg:min-h-0 lg:col-start-1 lg:row-start-1"
        onReplaceFile={handleFile}
        onError={(msg) => alert(msg)}
      />

      {/* 2. Carousel — mobile 2nd, desktop bottom-left */}
      <div className="shrink-0 lg:col-start-1 lg:row-start-2">
        <ProductCarousel
          products={displayedProducts}
          selectedId={selectedId}
          onSelect={handleProductSelect}
        />
      </div>

      {/* 3. Sliders — mobile 3rd (above the fold!), desktop bottom-right */}
      <div className="lg:col-start-2 lg:row-start-2">
        <AdjustmentSliders value={adjust} onChange={setAdjust} />
      </div>

      {/* 4. Right-top group: ActionBar + FaceShape + Filter
            — mobile 4th onwards, desktop top-right (scrolls if tall) */}
      <div
        className="
          flex flex-col gap-3
          lg:col-start-2 lg:row-start-1
          lg:overflow-y-auto lg:min-h-0 lg:pr-1
        "
      >
        {selectedProduct && (
          <ActionBar product={selectedProduct} canvasRef={canvasRef} />
        )}
        <FaceShapeSelector value={faceShape} onChange={setFaceShape} />
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
    </div>
  );
}
