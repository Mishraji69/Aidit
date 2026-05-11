import { NextResponse } from "next/server";
import { generateSummary } from "@/lib/ai";
import { summaryRequestSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { summary: null, error: "invalid_json" },
      { status: 400 }
    );
  }

  const parsed = summaryRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { summary: null, error: "invalid_request" },
      { status: 400 }
    );
  }

  try {
    const summary = await generateSummary(parsed.data);
    return NextResponse.json({ summary }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown summary error";
    console.error("Summary generation failed:", message);
    return NextResponse.json(
      { summary: null, error: "summary_unavailable" },
      { status: 200 }
    );
  }
}
