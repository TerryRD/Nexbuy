import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import type { AppointmentSlot, Product } from "@/lib/types/database";
import { BookingForm } from "./BookingForm";

type Params = Promise<{ slug: string }>;

export default async function BookAppointmentPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const sb = await createServerSupabase();

  const {
    data: { user },
  } = await sb.auth.getUser();

  const [productRes, slotsRes, customerRes] = await Promise.all([
    sb
      .from("products")
      .select("id, slug, name, kind, price_cents, brand, is_online_available")
      .eq("slug", slug)
      .eq("kind", "prescription_frame")
      .eq("is_online_available", true)
      .maybeSingle(),
    sb
      .from("appointment_slots")
      .select(
        "id, date, start_time, end_time, capacity, booked_count, is_active",
      )
      .eq("is_active", true)
      .gte("date", new Date().toISOString().slice(0, 10))
      .order("date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(60),
    user
      ? sb
          .from("customers")
          .select("display_name, phone")
          .eq("id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  if (productRes.error) {
    console.error("product query failed:", productRes.error);
    throw new Error("Failed to load product");
  }
  if (slotsRes.error) {
    console.error("slots query failed:", slotsRes.error);
    throw new Error("Failed to load slots");
  }

  if (!productRes.data) notFound();

  const product = productRes.data as Pick<
    Product,
    "id" | "slug" | "name" | "kind" | "price_cents" | "brand" | "is_online_available"
  >;

  // Supabase JS 不支援欄位對欄位比較,在這邊做最終過濾。
  // 24h reminder cron 會確保狀態一致,這裡僅針對 booked_count < capacity 收斂。
  const slots = ((slotsRes.data ?? []) as AppointmentSlot[]).filter(
    (s) => s.booked_count < s.capacity,
  );

  return (
    <div className="container py-10 md:py-14">
      <div className="mb-6">
        <Link
          href={`/products/${product.slug}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← 回到商品
        </Link>
      </div>

      <header className="mb-8 space-y-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
          預約到店配鏡
        </h1>
        <p className="text-muted-foreground">
          為「{product.name}」預約驗光配鏡時段。
          填寫聯絡資訊、選時段，到店後由驗光師完成配鏡。
          預約不收訂金；到店配鏡時結帳。
        </p>
      </header>

      {slots.length === 0 ? (
        <div className="rounded-lg border bg-muted/30 p-8 text-center">
          <p className="text-muted-foreground">
            目前沒有可預約時段。請稍後再試或直接到店洽詢。
          </p>
        </div>
      ) : (
        <BookingForm
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            price_cents: product.price_cents,
          }}
          slots={slots}
          defaults={
            user
              ? {
                  name: customerRes.data?.display_name ?? "",
                  email: user.email ?? "",
                  phone: customerRes.data?.phone ?? "",
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
