import Link from "next/link";
import Image from "next/image";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { toggleProductOnline, deleteProduct } from "./actions";

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  price_cents: number;
  kind: "finished" | "prescription_frame";
  finished_stock: number | null;
  is_online_available: boolean;
  image_urls: string[];
  created_at: string;
};

export default async function AdminProductsPage() {
  const sb = await createServerSupabase();
  const { data, error } = await sb
    .from("products")
    .select(
      "id, slug, name, brand, price_cents, kind, finished_stock, is_online_available, image_urls, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("admin products list error:", error);
    throw new Error("Failed to load products");
  }
  const rows = (data ?? []) as ProductRow[];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">商品管理</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            新增、編輯、上下架。下架不會刪商品,只是顧客看不到 / 不能買。
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className={buttonVariants({ size: "default" })}
        >
          + 新增商品
        </Link>
      </header>

      {rows.length === 0 ? (
        <p className="rounded-md border bg-muted/30 p-6 text-sm text-muted-foreground">
          還沒有商品。點右上角「新增商品」開始上架。
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((p) => (
            <ProductRow key={p.id} p={p} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ProductRow({ p }: { p: ProductRow }) {
  const cover = p.image_urls[0] ?? null;
  return (
    <li className="flex flex-wrap items-center gap-4 rounded-lg border p-3">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-muted/30">
        {cover ? (
          <Image
            src={cover}
            alt=""
            width={64}
            height={64}
            className="h-full w-full object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            無圖
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-medium">{p.name}</span>
          <Badge variant={p.kind === "finished" ? "default" : "outline"}>
            {p.kind === "finished" ? "成品" : "處方"}
          </Badge>
          {!p.is_online_available && <Badge variant="outline">下架</Badge>}
          {p.kind === "finished" && (p.finished_stock ?? 0) <= 0 && (
            <Badge variant="outline">售完</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {p.brand ? `${p.brand} · ` : ""}
          <span className="font-mono">{p.slug}</span>
          {" · "}
          {formatPrice(p.price_cents)}
          {p.kind === "finished" && p.finished_stock !== null && (
            <> · 庫存 {p.finished_stock}</>
          )}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={`/admin/products/${p.id}/edit`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          編輯
        </Link>
        <form action={toggleProductOnline}>
          <input type="hidden" name="id" value={p.id} />
          <input
            type="hidden"
            name="is_online_available"
            value={p.is_online_available ? "false" : "true"}
          />
          <Button type="submit" variant="outline" size="sm">
            {p.is_online_available ? "下架" : "上架"}
          </Button>
        </form>
        <form action={deleteProduct}>
          <input type="hidden" name="id" value={p.id} />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="text-destructive"
          >
            刪除
          </Button>
        </form>
      </div>
    </li>
  );
}
