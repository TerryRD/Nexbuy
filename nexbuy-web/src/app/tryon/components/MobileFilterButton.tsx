"use client";

import { Dialog } from "@base-ui/react/dialog";
import { SlidersHorizontal, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { FilterBar, type Filters } from "./FilterBar";
import type { Product } from "@/lib/types/database";

interface Props {
  products: Product[];
  value: Filters;
  onChange: (next: Filters) => void;
}

export function MobileFilterButton({ products, value, onChange }: Props) {
  const activeCount =
    (value.kind !== "all" ? 1 : 0) +
    (value.frameShape !== null ? 1 : 0) +
    (value.priceMin !== null || value.priceMax !== null ? 1 : 0);

  return (
    <Dialog.Root>
      <Dialog.Trigger
        className={buttonVariants({
          variant: "outline",
          size: "sm",
          className: "w-full justify-center",
        })}
      >
        <SlidersHorizontal className="size-4 mr-1" />
        篩選
        {activeCount > 0 && (
          <span className="ml-2 inline-flex items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">
            {activeCount}
          </span>
        )}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border bg-background shadow-lg flex flex-col max-h-[85vh]">
          <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
            <Dialog.Title className="font-semibold">篩選條件</Dialog.Title>
            <Dialog.Close className="rounded-sm p-1 text-muted-foreground hover:text-foreground transition-colors">
              <X className="size-4" />
            </Dialog.Close>
          </div>

          <div className="overflow-y-auto p-4">
            <FilterBar products={products} value={value} onChange={onChange} />
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
