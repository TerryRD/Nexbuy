import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { placeOrderSchema } from "@/lib/schemas/order";
import { publicEnv } from "@/lib/env";
import { sendEmail } from "@/lib/email/send";
import { orderPlacedEmail } from "@/lib/email/templates";
import { getClientIp, rateLimitOrders } from "@/lib/ratelimit";

export async function POST(request: NextRequest) {
  const limit = await rateLimitOrders(getClientIp(request));
  if (!limit.ok) {
    return NextResponse.json(
      { error: "RATE_LIMITED" },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSec) },
      },
    );
  }

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
    p_customer_email: input.customer_email,
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

  const successUrl = `${publicEnv.NEXT_PUBLIC_APP_URL}/orders/${row.order_no}`;

  // Fetch the just-created order's items + total for the confirmation email.
  // Separate query (vs returning everything from place_order) keeps the RPC
  // signature simple. One extra round-trip is fine; this isn't hot path.
  const { data: orderForEmail } = await admin
    .from("orders")
    .select("total_cents, items:order_items(product_name, quantity)")
    .eq("id", row.order_id)
    .maybeSingle();

  if (orderForEmail) {
    const o = orderForEmail as unknown as {
      total_cents: number;
      items: { product_name: string; quantity: number }[];
    };
    // Fire-and-forget: order is already committed, the user shouldn't wait an
    // extra round-trip and email failures shouldn't surface as 500s.
    void sendEmail(
      orderPlacedEmail({
        to: input.customer_email,
        customerName: input.customer_name,
        orderNo: row.order_no,
        paymentCode: row.payment_code,
        totalCents: o.total_cents,
        items: o.items.map((i) => ({
          productName: i.product_name,
          quantity: i.quantity,
        })),
        successUrl,
      }),
    );
  }

  return NextResponse.json(
    {
      order_id: row.order_id,
      order_no: row.order_no,
      success_url: successUrl,
    },
    { status: 201 },
  );
}
