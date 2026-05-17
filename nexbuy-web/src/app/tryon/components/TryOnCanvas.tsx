"use client";

import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { renderTryOn } from "../lib/canvas-renderer";
import type { Placement } from "../lib/glasses-placer";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB — kept in sync with SelfieUploader

interface Props {
  selfie: ImageBitmap;
  glasses: HTMLImageElement | null;
  placement: Placement | null;
  /** Parent owns the ref so it can call canvas.toBlob() for download. */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  className?: string;
  /** When provided, an overlay button + drag-drop zone lets the user
   *  swap the selfie without leaving the READY view. */
  onReplaceFile?: (file: File) => void;
  onError?: (message: string) => void;
}

export function TryOnCanvas({
  selfie,
  glasses,
  placement,
  canvasRef,
  className,
  onReplaceFile,
  onError,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Match canvas resolution to selfie (preserves quality on download)
    canvas.width = selfie.width;
    canvas.height = selfie.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderTryOn({ ctx, canvas, selfie, glasses, placement });
  }, [selfie, glasses, placement, canvasRef]);

  function validate(file: File): boolean {
    if (file.size > MAX_BYTES) {
      onError?.("圖片太大,請選 10MB 以下");
      return false;
    }
    if (!file.type.startsWith("image/")) {
      onError?.("不是圖片檔");
      return false;
    }
    return true;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Always reset so picking the same file again still fires onChange
    e.target.value = "";
    if (!file || !onReplaceFile) return;
    if (validate(file)) onReplaceFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    if (!onReplaceFile) return;
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    if (!onReplaceFile) return;
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (validate(file)) onReplaceFile(file);
  }

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-lg bg-muted transition-colors",
        isDragging && "ring-2 ring-primary ring-offset-2 bg-primary/5",
        className,
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full object-contain"
      />

      {onReplaceFile && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleChange}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-background/85 backdrop-blur px-3 py-1.5 text-xs font-medium shadow-sm ring-1 ring-border/50 hover:bg-background transition-colors"
          >
            <Camera className="size-3.5" />
            換一張照片
          </button>

          {isDragging && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-primary/10">
              <p className="rounded-full bg-background/90 px-4 py-2 text-sm font-medium shadow">
                放開就換照片
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
