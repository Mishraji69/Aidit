import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { saveAuditSchema } from "@/lib/validation";

export const runtime = "nodejs";

const createShareId = () => randomUUID().replace(/-/g, "").slice(0, 20);

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = saveAuditSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "supabase_not_configured" },
      { status: 500 }
    );
  }

  const shareId = createShareId();
  const { error, data } = await supabase
    .from("audits")
    .insert({
      share_id: shareId,
      tools: parsed.data.tools,
      audit: parsed.data.audit,
      email: parsed.data.email ?? null,
    })
    .select("share_id")
    .single();

  if (error) {
    console.error("Audit save failed:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return NextResponse.json({ error: "db_insert_failed" }, { status: 500 });
  }

  return NextResponse.json({ shareId: data?.share_id ?? shareId }, { status: 200 });
}
