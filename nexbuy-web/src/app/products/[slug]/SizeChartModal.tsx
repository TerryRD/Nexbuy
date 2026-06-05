"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SizeRow {
  size: string;
  lens: number;
  bridge: number;
  temple: number;
}

const SIZE_DATA: SizeRow[] = [
  { size: "S", lens: 50, bridge: 18, temple: 140 },
  { size: "M", lens: 52, bridge: 19, temple: 145 },
  { size: "L", lens: 54, bridge: 20, temple: 148 },
];

interface Props {
  currentSize?: string;
}

export function SizeChartModal({ currentSize }: Props) {
  return (
    <Dialog.Root>
      <Dialog.Trigger className="text-sm text-primary underline underline-offset-4 hover:text-primary/80 transition-colors cursor-pointer">
        尺寸對照表
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 transition-opacity duration-200" />

        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-xl data-[ending-style]:opacity-0 data-[ending-style]:scale-95 data-[starting-style]:opacity-0 data-[starting-style]:scale-95 transition-all duration-200">
          {/* Header */}
          <div className="mb-5 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-foreground">
              鏡框尺寸對照
            </Dialog.Title>
            <Dialog.Close className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <X className="size-4" aria-hidden="true" />
              <span className="sr-only">關閉</span>
            </Dialog.Close>
          </div>

          {/* Size table */}
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    尺寸
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                    鏡片寬
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                    鼻樑
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                    鏡腳
                  </th>
                </tr>
              </thead>
              <tbody>
                {SIZE_DATA.map((row, i) => {
                  const isHighlighted =
                    currentSize?.toUpperCase() === row.size;
                  return (
                    <tr
                      key={row.size}
                      className={cn(
                        "transition-colors",
                        i < SIZE_DATA.length - 1 && "border-b border-border",
                        isHighlighted
                          ? "bg-primary/5"
                          : "hover:bg-muted/30"
                      )}
                    >
                      <td className="px-4 py-2.5 font-medium text-foreground">
                        {row.size}
                        {isHighlighted && (
                          <span className="ml-2 text-xs text-primary">
                            ← 目前
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-foreground">
                        {row.lens} mm
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-foreground">
                        {row.bridge} mm
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-foreground">
                        {row.temple} mm
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Measurement tip */}
          <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
            如何量自己現有鏡框：鏡片寬 = 單側鏡片最寬處；鼻樑 = 兩鏡片間距；
            鏡腳 = 鉸鏈到尾端。所有數值單位均為毫米（mm）。
          </p>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
