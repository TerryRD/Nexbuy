import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { placeOrderSchema } from "@/lib/schemas/order";
import { publicEnv } from "@/lib/env";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = placeOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const input = parsed.data;

  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  const admin = createAdminSupabase();
  const { data, error } = await admin.rpc("place_order", {
    p_items: input.items.map((i) => ({
      product_id: i.product_id,
      quantity: i.quantity,
    })),
    p_customer_name: input.customer_name,
    p_customer_phone: input.customer_phone,
    p_shipping_address: input.shipping_address,
    p_note: input.note ?? null,
    p_user_id: user?.id ?? null,
  });

  if (error) {
    if (error.message?.includes("OUT_OF_STOCK")) {
      return NextResponse.json({ error: "OUT_OF_STOCK" }, { status: 409 });
    }
    if (error.message?.includes("EMPTY_CART")) {
      return NextResponse.json({ error: "EMPTY_CART" }, { status: 400 });
    }
    if (
      error.message?.includes("INVALID_CUSTOMER") ||
      error.message?.includes("INVALID_QUANTITY")
    ) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }
    console.error("place_order error:", error);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }

  const row = data?.[0];
  if (!row) {
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }

  return NextResponse.json(
    {
      order_id: row.order_id,
      order_no: row.order_no,
      success_url: `${publicEnv.NEXT_PUBLIC_APP_URL}/orders/${row.order_no}`,
    },
    { status: 201 },
  );
}
