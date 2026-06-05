import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types/database";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { CompareRemoveButton } from "./CompareRemoveButton";
import { CompareUrlSync } from "./CompareUrlSync";
import { getProductImageUrl } from "@/lib/product-placeholder";
import { AddToCartButton } from "@/app/products/[slug]/AddToCartButton";
import { MAX_COMPARE } from "@/lib/compare";

export const metadata = {
  title: "商品比較",
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    .slice(0, MAX_COMPARE);

  let ordered: Product[] = [];
  if (ids.length > 0) {
    const sb = await createServerSupabase();
    const { data, error } = await sb
      .from("products")
      .select(
        "id, slug, name, description, price_cents, image_urls, brand, kind, finished_stock, is_online_available, face_shape, frame_shape, frame_size, material, color",
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

  // 永遠 MAX_COMPARE 格 — 沒選的位置給「+ 加入比較」placeholder
  const slots: (Product | null)[] = Array(MAX_COMPARE).fill(null);
  ordered.forEach((p, i) => {
    slots[i] = p;
  });
  const filledCount = ordered.length;

  return (
    <div className="container py-10 md:py-14">
      {/* CompareUrlSync：mount 後若 URL 無 ids 但 localStorage 有，replace URL */}
      <CompareUrlSync />

      {/* Header */}
      <header className="mb-10">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          COMPARE
        </p>
        <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          鏡框比較
        </h1>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          並排對照規格，找到最適合你的那副。
        </p>
      </header>

      {filledCount === 0 ? (
        /* ── 空狀態 ── */
        <div className="flex flex-col items-center gap-6 py-24 text-center">
          <p className="max-w-sm text-muted-foreground">
            還沒有要比較的鏡框，從商品頁點「加入比較」最多放 {MAX_COMPARE}{" "}
            副在這裡 side-by-side 比較。
          </p>
          <Link
            href="/products"
            className={buttonVariants({ variant: "default", size: "default" })}
          >
            逛商品
          </Link>
        </div>
      ) : (
        /* ── 比較格線 ── */
        <ComparisonGrid slots={slots} />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────── */
/*  ComparisonGrid                                      */
/* ─────────────────────────────────────────────────── */

type SpecRow = {
  label: string;
  render: (p: Product) => React.ReactNode;
};

function ComparisonGrid({ slots }: { slots: (Product | null)[] }) {
  const specRows: SpecRow[] = [
    {
      label: "類型",
      render: (p) => (
        <Badge variant={p.kind === "finished" ? "default" : "outline"}>
          {p.kind === "finished" ? "成品眼鏡" : "處方鏡架"}
        </Badge>
      ),
    },
    {
      label: "售價",
      render: (p) => (
        <span className="font-semibold text-primary">
          {formatPrice(p.price_cents)}
        </span>
      ),
    },
    {
      label: "框形",
      render: (p) => (
        <span className="text-sm">{p.frame_shape ?? "—"}</span>
      ),
    },
    {
      label: "鏡架尺寸",
      render: (p) => (
        <span className="font-mono text-sm">{p.frame_size ?? "—"}</span>
      ),
    },
    {
      label: "材質",
      render: (p) => <span className="text-sm">{p.material ?? "—"}</span>,
    },
    {
      label: "主色",
      render: (p) => <span className="text-sm">{p.color ?? "—"}</span>,
    },
    {
      label: "適合臉型",
      render: (p) =>
        p.face_shape && p.face_shape.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {p.face_shape.map((s) => (
              <span
                key={s}
                className="rounded-full border border-border bg-card px-2 py-0.5 text-xs text-foreground"
              >
                {s}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      label: "庫存",
      render: (p) => {
        if (p.kind !== "finished") {
          return <span className="text-sm text-muted-foreground">—</span>;
        }
        const stock = p.finished_stock ?? 0;
        return stock > 0 ? (
          <span className="text-sm">{stock} 副</span>
        ) : (
          <span className="text-sm text-muted-foreground">已售完</span>
        );
      },
    },
  ];

  return (
    <div className="overflow-x-auto">
      {/*
        Grid: label col (fixed) + up-to-4 product cols.
        min-w ensures columns don't crush on mobile.
      */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: `9rem repeat(${slots.length}, minmax(11rem, 1fr))`,
        }}
      >
        {/* ── Product header row ── */}

        {/* label col spacer */}
        <div />

        {/* product columns */}
        {slots.map((p, i) => (
          <div
            key={p?.id ?? `empty-header-${i}`}
            className="flex flex-col gap-3 border-b border-border p-4"
          >
            {p ? (
              <>
                {/* Product image */}
                <Link href={`/products/${p.slug}`} className="block">
                  <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-card">
                    <Image
                      src={getProductImageUrl(p)}
                      alt={p.name}
                      fill
                      sizes="(min-width: 768px) 25vw, 50vw"
                      unoptimized={!p.image_urls?.[0]}
                      className="object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                </Link>

                {/* Name + remove */}
                <div className="flex flex-col gap-1.5">
                  <Link
                    href={`/products/${p.slug}`}
                    className="font-serif text-sm font-semibold leading-snug text-foreground hover:text-primary hover:underline"
                  >
                    {p.name}
                  </Link>
                  <CompareRemoveButton id={p.id} />
                </div>
              </>
            ) : (
              /* Empty slot */
              <EmptySlotCard />
            )}
          </div>
        ))}

        {/* ── Spec rows ── */}
        {specRows.map((row) => (
          <>
            {/* Label cell */}
            <div
              key={`label-${row.label}`}
              className="flex items-start border-b border-border bg-card px-4 py-3"
            >
              <span className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {row.label}
              </span>
            </div>

            {/* Value cells */}
            {slots.map((p, i) =>
              p ? (
                <div
                  key={`${row.label}-${p.id}`}
                  className="border-b border-border p-4"
                >
                  {row.render(p)}
                </div>
              ) : (
                <div
                  key={`${row.label}-empty-${i}`}
                  className="border-b border-border p-4"
                >
                  <span className="text-sm text-muted-foreground">—</span>
                </div>
              ),
            )}
          </>
        ))}

        {/* ── Per-column CTA row ── */}
        {/* label spacer */}
        <div className="px-4 py-4" />

        {slots.map((p, i) => (
          <div key={p?.id ?? `cta-${i}`} className="p-4">
            {p ? (
              p.kind === "finished" ? (
                <AddToCartButton
                  product={{
                    product_id: p.id,
                    slug: p.slug,
                    name: p.name,
                    price_cents: p.price_cents,
                    image_url: getProductImageUrl(p),
                  }}
                  disabled={(p.finished_stock ?? 0) <= 0}
                  disabledReason="暫時缺貨"
                />
              ) : (
                <Link
                  href={`/appointment/book/${p.slug}`}
                  className={buttonVariants({ size: "sm" })}
                >
                  預約到店配鏡
                </Link>
              )
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────── */
/*  EmptySlotCard                                       */
/* ─────────────────────────────────────────────────── */

/**
 * 空格的「+ 加入比較」placeholder：dashed border + 中央加號，連到商品清單。
 * 客戶在 list / PDP 點「加入比較」後，state 自動寫進 localStorage，
 * 回到 /compare 就會看到那個商品出現在原本空的格子裡。
 */
function EmptySlotCard() {
  return (
    <Link
      href="/products"
      className="group flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-card text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
    >
      <Plus className="size-8" aria-hidden />
      <span className="text-xs font-medium">+ 加入比較</span>
    </Link>
  );
}
