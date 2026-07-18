import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Bypasses RLS entirely. Server-only, and never for reading/writing on a
 * user's behalf — only for privileged writes the app itself is responsible
 * for, like activity_logs (owner-only under RLS, but every admin's actions
 * need to be logged, not just the owner's).
 */
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
