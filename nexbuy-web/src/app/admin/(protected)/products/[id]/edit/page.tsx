import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { ProductForm, type ProductInitial } from "../../ProductForm";
import { updateProductAction } from "../../actions";

type Params = Promise<{ id: string }>;

export default async function AdminProductEditPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const sb = await createServerSupabase();
  const { data, error } = await sb
    .from("products")
    .select(
      "id, name, slug, description, brand, price_cents, kind, finished_stock, low_stock_threshold, is_online_available, image_urls, face_shape, frame_shape, frame_size, material, color, try_on_image_url",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error("Failed to load product");
  if (!data) notFound();

  const initial = {
    ...data,
    image_urls: (data.image_urls as string[] | null) ?? [],
    face_shape: (data.face_shape as string[] | null) ?? [],
    try_on_image_url: (data.try_on_image_url as string | null) ?? null,
  } as ProductInitial;

  // Bind productId via closure so the Server Action gets it.
  const action = updateProductAction.bind(null, initial.id!);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/products"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← 回商品清單
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">編輯商品</h1>
      </div>

      <ProductForm initial={initial} action={action} submitLabel="儲存變更" />
    </div>
  );
}
