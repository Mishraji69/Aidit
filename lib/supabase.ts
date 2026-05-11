import { createClient } from "@supabase/supabase-js";

const getEnv = (key: string) => process.env[key];

export const createSupabaseServerClient = () => {
  const url = getEnv("SUPABASE_URL");
  const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceKey) return null;

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};
