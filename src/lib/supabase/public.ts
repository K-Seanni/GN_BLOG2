import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/** Cookie-less anon client for cacheable public reads; RLS limits it to published content. */
export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
  );
}
