import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  if (!token || token.length !== 32 || !/^[0-9a-f]+$/.test(token)) {
    return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 403 });
  }

  const admin = createAdminSupabase();
  const { error } = await admin.rpc("cancel_appointment", {
    p_cancel_token: token,
  });

  if (error) {
    if (error.message?.includes("INVALID_TOKEN")) {
      return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 403 });
    }
    if (error.message?.includes("CANNOT_CANCEL")) {
      return NextResponse.json({ error: "CANNOT_CANCEL" }, { status: 409 });
    }
    console.error("cancel_appointment error:", error);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
