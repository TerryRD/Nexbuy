"use client";

import { ChevronDown } from "lucide-react";
import { SORT_OPTIONS, type SortKey } from "@/app/products/sort";

export function SortSelect({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (next: SortKey) => void;
}) {
  return (
    <div className="relative inline-flex items-center">
      <select
        aria-label="排序方式"
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        className="appearance-none rounded-full border border-border bg-card py-1.5 pl-4 pr-9 text-sm text-foreground transition-colors hover:border-ink-soft focus-visible:border-foreground focus-visible:outline-none"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 size-4 text-muted-foreground" aria-hidden />
    </div>
  );
}
