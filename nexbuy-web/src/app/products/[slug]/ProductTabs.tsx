"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types/database";

type Tab = "intro" | "spec" | "care";

interface TabConfig {
  id: Tab;
  label: string;
}

const TABS: TabConfig[] = [
  { id: "intro", label: "商品介紹" },
  { id: "spec", label: "規格" },
  { id: "care", label: "保養與保固" },
];

const KIND_LABEL: Record<string, string> = {
  finished: "成品眼鏡",
  prescription_frame: "處方鏡架",
};

interface SpecRow {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}

function buildSpecRows(product: Product): SpecRow[] {
  return [
    { label: "編號", value: product.slug, mono: true },
    { label: "類型", value: KIND_LABEL[product.kind] ?? product.kind },
    { label: "框形", value: product.frame_shape },
    { label: "材質", value: product.material },
    { label: "鏡架尺寸", value: product.frame_size },
    { label: "主色", value: product.color },
    {
      label: "適合臉型",
      value:
        product.face_shape && product.face_shape.length > 0
          ? product.face_shape.join("、")
          : null,
    },
  ].filter((row): row is SpecRow & { value: string } => Boolean(row.value));
}

const CARE_ITEMS = [
  "以超細纖維布輕輕擦拭鏡片，避免使用紙巾或衣物，以防刮傷。",
  "摘戴時請雙手持鏡腳，避免單手施力造成鏡框歪斜。",
  "定期攜帶至門市免費調整鼻托與鏡腳，維持最佳配戴舒適度。",
  "鏡框材質及製造瑕疵享有一年保固；人為損壞及鏡片消耗不在保固範圍內。",
];

interface Props {
  product: Product;
}

export function ProductTabs({ product }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("intro");
  const specRows = buildSpecRows(product);

  return (
    <div>
      {/* Tab buttons */}
      <div role="tablist" aria-label="商品資訊分頁" className="flex border-b border-border">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative px-4 py-2.5 text-sm font-medium transition-colors select-none",
                "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:transition-colors",
                isActive
                  ? "text-foreground after:bg-primary"
                  : "text-muted-foreground hover:text-foreground after:bg-transparent"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab panels */}
      <div className="pt-5">
        {/* 商品介紹 */}
        <div
          role="tabpanel"
          id="tabpanel-intro"
          aria-labelledby="tab-intro"
          hidden={activeTab !== "intro"}
          className="text-sm text-foreground leading-relaxed whitespace-pre-line"
        >
          {product.description ??
            "這款眼鏡結合時尚設計與舒適配戴，適合日常通勤及輕鬆休閒場合。"}
        </div>

        {/* 規格 */}
        <div
          role="tabpanel"
          id="tabpanel-spec"
          aria-labelledby="tab-spec"
          hidden={activeTab !== "spec"}
        >
          <dl className="divide-y divide-border rounded-lg border border-border overflow-hidden text-sm">
            {specRows.map((row) => (
              <div key={row.label} className="flex px-4 py-2.5 gap-4">
                <dt className="w-24 shrink-0 text-muted-foreground">
                  {row.label}
                </dt>
                <dd
                  className={cn(
                    "text-foreground",
                    row.mono && "font-mono tabular-nums"
                  )}
                >
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* 保養與保固 */}
        <div
          role="tabpanel"
          id="tabpanel-care"
          aria-labelledby="tab-care"
          hidden={activeTab !== "care"}
          className="text-sm text-foreground"
        >
          <ul className="space-y-3">
            {CARE_ITEMS.map((item, i) => (
              <li key={i} className="flex gap-2.5 leading-relaxed">
                <span
                  className="mt-1 size-1.5 shrink-0 rounded-full bg-primary"
                  aria-hidden="true"
                />
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
