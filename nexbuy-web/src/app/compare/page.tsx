import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types/database";
import { Badge } from "@/components/ui/badge";
import { CompareRemoveButton } from "./CompareRemoveButton";
import { getProductImageUrl } from "@/lib/product-placeholder";

export const metadata = {
  title: "商品比較 — 精鋐眼鏡行",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX = 3;

type SearchParams = Promise<{ ids?: string }>;

export default async function ComparePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { ids: raw } = await searchParams;
  const ids = (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => UUID_RE.test(s))
    .slice(0, MAX);

  let ordered: Product[] = [];
  if (ids.length > 0) {
    const sb = await createServerSupabase();
    const { data, error } = await sb
      .from("products")
      .select(
        "id, slug, name, description, price_cents, image_urls, brand, kind, finished_stock, is_online_available, face_shape, frame_size, material, color",
      )
      .in("id", ids)
      .eq("is_online_available", true);

    if (error) {
      console.error("compare query failed:", error);
      throw new Error("Failed to load comparison");
    }

    const fetched = (data ?? []) as Product[];
    // 按 URL 順序排，避免 Supabase 亂序
    ordered = ids
      .map((id) => fetched.find((p) => p.id === id))
      .filter((p): p is Product => p !== undefined);
  }

  // 永遠 3 格 — 沒選的位置給「+ 加入比較」placeholder。slot count 固定避
  // 免 client/server 切換時 layout 跳動。
  const slots: (Product | null)[] = Array(MAX).fill(null);
  ordered.forEach((p, i) => {
    slots[i] = p;
  });
  const filledCount = ordered.length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8">
        <Link
          href="/products"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← 回商品清單
        </Link>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight md:text-4xl">
          商品比較{" "}
          <span className="text-muted-foreground">
            ({filledCount} / {MAX})
          </span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {filledCount === 0
            ? `三個欄位都還沒選。點「加入比較」可以從商品清單挑最多 ${MAX} 副放這邊 side-by-side 比。`
            : `空格可從下方「+ 加入比較」點過去再挑商品。最多 ${MAX} 副。`}
        </p>
      </header>

      <ComparisonGrid slots={slots} />
    </div>
  );
}

function ComparisonGrid({ slots }: { slots: (Product | null)[] }) {
  const rows: { label: string; render: (p: Product) => React.ReactNode }[] = [
    {
      label: "圖片",
      render: (p) => {
        const src = getProductImageUrl(p);
        return (
          <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted/30">
            <Image
              src={src}
              alt={p.name}
              fill
              sizes="(min-width: 768px) 33vw, 100vw"
              unoptimized={!p.image_urls[0]}
              className="object-cover"
            />
          </div>
        );
      },
    },
    {
      label: "類型",
      render: (p) => (
        <Badge variant={p.kind === "finished" ? "default" : "outline"}>
          {p.kind === "finished" ? "成品眼鏡" : "處方鏡架"}
        </Badge>
      ),
    },
    {
      label: "品牌",
      render: (p) => p.brand ?? "—",
    },
    {
      label: "售價",
      render: (p) => (
        <span className="font-semibold text-foreground">
          {formatPrice(p.price_cents)}
        </span>
      ),
    },
    {
      label: "適合臉型",
      render: (p) =>
        p.face_shape && p.face_shape.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {p.face_shape.map((s) => (
              <span
                key={s}
                className="rounded-full border border-border/60 bg-background/80 px-2 py-0.5 text-xs"
              >
                {s}
              </span>
            ))}
          </div>
        ) : (
          "—"
        ),
    },
    {
      label: "鏡架尺寸",
      render: (p) => p.frame_size ?? "—",
    },
    {
      label: "材質",
      render: (p) => p.material ?? "—",
    },
    {
      label: "主色",
      render: (p) => p.color ?? "—",
    },
    {
      label: "庫存",
      render: (p) =>
        p.kind === "finished"
          ? (p.finished_stock ?? 0) > 0
            ? `${p.finished_stock} 副`
            : "已售完"
          : "—",
    },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr>
            <th className="w-28 sm:w-32" />
            {slots.map((p, i) => (
              <th key={p?.id ?? `empty-${i}`} className="p-3 text-left align-top">
                {p ? (
                  <div className="space-y-2">
                    <Link
                      href={`/products/${p.slug}`}
                      className="block font-heading text-base font-semibold leading-tight hover:underline"
                    >
                      {p.name}
                    </Link>
                    <CompareRemoveButton id={p.id} />
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">空格</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t">
              <th
                scope="row"
                className="bg-muted/30 p-3 text-left align-top text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                {row.label}
              </th>
              {slots.map((p, i) =>
                p ? (
                  <td key={p.id} className="p-3 align-top text-sm">
                    {row.render(p)}
                  </td>
                ) : (
                  <td
                    key={`empty-${i}-${row.label}`}
                    className="p-3 align-top text-sm"
                  >
                    {row.label === "圖片" ? (
                      <EmptySlotCard />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                ),
              )}
            </tr>
          ))}
          <tr className="border-t">
            <th className="bg-muted/30" />
            {slots.map((p, i) => (
              <td key={p?.id ?? `cta-${i}`} className="p-3 align-top">
                {p ? (
                  <Link
                    href={`/products/${p.slug}`}
                    className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                  >
                    去看商品 →
                  </Link>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    從上方圖片區選商品
                  </span>
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/**
 * 空格的「+ 加入比較」placeholder：dashed border + 中央加號，連到商品清單。
 * 客戶在 list / PDP 點「加入比較」按鈕後，state 自動寫進 localStorage，
 * 回到 /compare 就會看到那個商品出現在原本空的格子裡。
 */
function EmptySlotCard() {
  return (
    <Link
      href="/products"
      className="group flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/60 bg-muted/10 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
    >
      <Plus className="size-8" aria-hidden />
      <span className="text-xs font-medium">從這加入</span>
    </Link>
  );
}
