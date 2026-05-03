import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types/database";
import { Badge } from "@/components/ui/badge";
import { CompareRemoveButton } from "./CompareRemoveButton";

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

  if (ids.length === 0) {
    return <EmptyState />;
  }

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

  // 按 URL 順序重排，避免 Supabase 隨機亂序
  const ordered = ids
    .map((id) => fetched.find((p) => p.id === id))
    .filter((p): p is Product => p !== undefined);

  // ids 全部失效（被下架）→ 直接回 /products
  if (ordered.length === 0) {
    redirect("/products");
  }

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
          商品比較 ({ordered.length})
        </h1>
      </header>

      <ComparisonGrid products={ordered} />
    </div>
  );
}

function ComparisonGrid({ products }: { products: Product[] }) {
  const rows: { label: string; render: (p: Product) => React.ReactNode }[] = [
    {
      label: "圖片",
      render: (p) =>
        p.image_urls[0] ? (
          <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted/30">
            <Image
              src={p.image_urls[0]}
              alt={p.name}
              fill
              sizes="(min-width: 768px) 33vw, 100vw"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="aspect-square rounded-lg border bg-muted/30" />
        ),
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
            {products.map((p) => (
              <th key={p.id} className="p-3 text-left align-top">
                <div className="space-y-2">
                  <Link
                    href={`/products/${p.slug}`}
                    className="block font-heading text-base font-semibold leading-tight hover:underline"
                  >
                    {p.name}
                  </Link>
                  <CompareRemoveButton id={p.id} />
                </div>
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
              {products.map((p) => (
                <td key={p.id} className="p-3 align-top text-sm">
                  {row.render(p)}
                </td>
              ))}
            </tr>
          ))}
          <tr className="border-t">
            <th className="bg-muted/30" />
            {products.map((p) => (
              <td key={p.id} className="p-3 align-top">
                <Link
                  href={`/products/${p.slug}`}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                >
                  去看商品 →
                </Link>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="font-heading text-2xl font-semibold">還沒選任何商品</h1>
      <p className="mt-3 text-muted-foreground">
        在商品詳情頁點「加入比較」加入最多 3 副，再回到這裡 side-by-side 比較。
      </p>
      <Link
        href="/products"
        className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
      >
        去逛商品
      </Link>
    </div>
  );
}
