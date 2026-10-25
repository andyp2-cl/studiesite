import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { publicEnv } from "@/lib/env";

/**
 * Service-role client that BYPASSES RLS. Only use it in server code that has
 * already verified the caller is an admin (e.g. creating student accounts).
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("Missing environment variable SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createClient<Database>(publicEnv.supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
