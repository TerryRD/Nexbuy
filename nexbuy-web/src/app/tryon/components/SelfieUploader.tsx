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
