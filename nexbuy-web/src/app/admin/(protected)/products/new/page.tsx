import Link from "next/link";
import { ProductForm } from "../ProductForm";
import { createProductAction } from "../actions";

export default function AdminProductNewPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/products"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← 回商品清單
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">新增商品</h1>
      </div>

      <ProductForm
        initial={{
          name: "",
          slug: "",
          description: null,
          brand: null,
          price_cents: 0,
          kind: "finished",
          finished_stock: 0,
          low_stock_threshold: 3,
          is_online_available: true,
          image_urls: [],
          face_shape: [],
          frame_size: null,
          material: null,
          color: null,
        }}
        action={createProductAction}
        submitLabel="建立商品"
      />
    </div>
  );
}
