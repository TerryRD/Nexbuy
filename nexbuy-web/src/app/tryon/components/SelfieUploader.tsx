"use client";

import { useRef, useState } from "react";
import { Upload, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

interface Props {
  onFile: (file: File) => void;
  onError: (message: string) => void;
}

export function SelfieUploader({ onFile, onError }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function validate(file: File): boolean {
    if (file.size > MAX_BYTES) {
      onError("圖片太大,請選 10MB 以下");
      return false;
    }
    if (!file.type.startsWith("image/")) {
      onError("不是圖片檔");
      return false;
    }
    return true;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (validate(file)) {
      onFile(file);
    } else {
      e.target.value = ""; // allow re-pick same file after fix
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    // Only leave when actually exiting the drop zone, not transitioning over
    // child elements.
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (validate(file)) onFile(file);
  }

  return (
    <div className="space-y-4">
      {/* Privacy notice — prominent, above the upload zone */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-900/40 dark:bg-blue-950/30">
        <Lock className="size-5 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-blue-900 dark:text-blue-100">
            隱私保證:照片只在你的瀏覽器處理
          </p>
          <p className="text-blue-700 dark:text-blue-300 mt-0.5">
            不會上傳到我們的伺服器或任何地方,關閉分頁就消失。
          </p>
        </div>
      </div>

      <div
        className={cn(
          "flex flex-col items-center justify-center gap-6 rounded-lg border-2 border-dashed px-6 py-16 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/10"
            : "border-muted-foreground/30 bg-muted/20",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload
          className={cn(
            "size-12 transition-colors",
            isDragging ? "text-primary" : "text-muted-foreground/60",
          )}
        />
        <div className="space-y-2 max-w-md">
          <h2 className="text-xl font-semibold">
            {isDragging ? "放開就上傳" : "上傳一張正面自拍"}
          </h2>
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
        <p className="text-xs text-muted-foreground">或把照片直接拖進來</p>
      </div>
    </div>
  );
}
