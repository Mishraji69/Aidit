import { createSupabaseServerClient } from "./supabase";
import { saveAuditSchema } from "./validation";
import type { AuditResult, ToolInput } from "./types";

export type StoredAudit = {
  shareId: string;
  tools: ToolInput[];
  audit: AuditResult;
  createdAt: string | null;
};

export type AuditLookupError =
  | "supabase_not_configured"
  | "not_found"
  | "db_error";

export const getAuditByShareId = async (shareId: string) => {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return { data: null, error: "supabase_not_configured" as const };
  }

  const { data, error } = await supabase
    .from("audits")
    .select("share_id, tools, audit, email, created_at")
    .eq("share_id", shareId)
    .maybeSingle();

  if (error) {
    return { data: null, error: "db_error" as const };
  }

  if (!data) {
    return { data: null, error: "not_found" as const };
  }

  const parsed = saveAuditSchema.safeParse({
    tools: data.tools,
    audit: data.audit,
    email: data.email,
  });

  if (!parsed.success) {
    return { data: null, error: "db_error" as const };
  }

  return {
    data: {
      shareId: data.share_id,
      tools: parsed.data.tools,
      audit: parsed.data.audit,
      createdAt: data.created_at ?? null,
    } as StoredAudit,
  };
};
