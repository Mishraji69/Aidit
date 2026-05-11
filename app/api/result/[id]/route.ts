import { NextResponse } from "next/server";
import { getAuditByShareId } from "@/lib/audits";
import { shareIdSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const parsed = shareIdSchema.safeParse(id);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const { data, error } = await getAuditByShareId(parsed.data);

  if (error === "supabase_not_configured") {
    return NextResponse.json(
      { error: "supabase_not_configured" },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      shareId: data.shareId,
      tools: data.tools,
      audit: data.audit,
      createdAt: data.createdAt,
    },
    { status: 200 }
  );
}
