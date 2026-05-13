import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";

const cartItemSchema = z.object({
  product_id: z.string().uuid(),
  slug: z.string().min(1).max(200),
  name: z.string().min(1).max(200),
  price_cents: z.number().int().positive(),
  quantity: z.number().int().min(1).max(10),
  image_url: z.string().url().optional().nullable(),
});

const putBodySchema = z.array(cartItemSchema).max(50);

// GET /api/cart — 回傳目前登入使用者的 server 購物車
export async function GET() {
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    return NextResponse.json({ items: [] });
  }

  const { data, error } = await sb
    .from("cart_items")
    .select("product_id, slug, name, price_cents, quantity, image_url")
    .eq("user_id", user.id);

  if (error) {
    console.error("[cart] GET error:", error);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}

// PUT /api/cart — 用傳入的 items 完整替換 server 購物車（upsert + 刪除舊的）
export async function PUT(request: NextRequest) {
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = putBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const items = parsed.data;

  if (items.length === 0) {
    // 清空
    await sb.from("cart_items").delete().eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  }

  const rows = items.map((i) => ({
    user_id: user.id,
    product_id: i.product_id,
    slug: i.slug,
    name: i.name,
    price_cents: i.price_cents,
    quantity: i.quantity,
    image_url: i.image_url ?? null,
    updated_at: new Date().toISOString(),
  }));

  // Upsert 新的 items
  const { error: upsertErr } = await sb
    .from("cart_items")
    .upsert(rows, { onConflict: "user_id,product_id" });

  if (upsertErr) {
    console.error("[cart] PUT upsert error:", upsertErr);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }

  // 刪除不在本次清單的舊 items（換裝置可能有已刪除的舊品）
  const keepIds = items.map((i) => i.product_id);
  const { error: deleteErr } = await sb
    .from("cart_items")
    .delete()
    .eq("user_id", user.id)
    .not("product_id", "in", `(${keepIds.map((id) => `"${id}"`).join(",")})`);

  if (deleteErr) {
    console.error("[cart] PUT delete stale error:", deleteErr);
  }

  return NextResponse.json({ ok: true });
}
