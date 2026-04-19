import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAppointmentSchema } from "@/lib/schemas/appointment";
import { publicEnv } from "@/lib/env";
import { sendEmail } from "@/lib/email/send";
import { appointmentBookedEmail } from "@/lib/email/templates";
import { formatDate, formatTime } from "@/lib/format";

export async function POST(request: NextRequest) {
  // 1. Parse + validate
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "INVALID_JSON" },
      { status: 400 },
    );
  }

  const parsed = createAppointmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const input = parsed.data;

  // 2. 如果使用者有登入，拿 user_id 綁 appointment
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  // 3. 用 service role 呼叫 book_appointment RPC
  //    (RPC 是 SECURITY DEFINER，其實 anon role 也可以呼叫；
  //     用 admin client 是為了未來擴充管理場景)
  const admin = createAdminSupabase();
  const { data, error } = await admin.rpc("book_appointment", {
    p_slot_id: input.slot_id,
    p_customer_name: input.customer_name,
    p_customer_email: input.customer_email,
    p_customer_phone: input.customer_phone,
    p_frame_product_id: input.frame_product_id ?? null,
    p_user_id: user?.id ?? null,
    p_note: input.note ?? null,
  });

  if (error) {
    if (error.message?.includes("SLOT_FULL")) {
      return NextResponse.json(
        { error: "SLOT_FULL" },
        { status: 409 },
      );
    }
    console.error("book_appointment error:", error);
    return NextResponse.json(
      { error: "INTERNAL" },
      { status: 500 },
    );
  }

  const row = data?.[0];
  if (!row) {
    return NextResponse.json(
      { error: "INTERNAL" },
      { status: 500 },
    );
  }

  const cancelUrl = `${publicEnv.NEXT_PUBLIC_APP_URL}/appointment/${row.cancel_token}`;

  // Look up slot date/time + frame name for the confirmation email. RPC
  // already committed the booking; this is just decoration. If it fails
  // (Supabase blip), the success response still returns and email is just
  // skipped.
  const { data: ctx } = await admin
    .from("appointments")
    .select(
      "slot:appointment_slots(date, start_time, end_time), frame:products(name)",
    )
    .eq("id", row.appointment_id)
    .maybeSingle();

  const slot = (ctx?.slot ?? null) as unknown as {
    date: string;
    start_time: string;
    end_time: string;
  } | null;
  const frame = (ctx?.frame ?? null) as unknown as { name: string } | null;

  if (slot) {
    void sendEmail(
      appointmentBookedEmail({
        to: input.customer_email,
        customerName: input.customer_name,
        appointmentDate: formatDate(slot.date),
        appointmentTime: `${formatTime(slot.start_time)} – ${formatTime(slot.end_time)}`,
        frameName: frame?.name ?? null,
        cancelUrl,
      }),
    );
  }

  return NextResponse.json(
    {
      appointment_id: row.appointment_id,
      cancel_token: row.cancel_token,
      cancel_url: cancelUrl,
    },
    { status: 201 },
  );
}
