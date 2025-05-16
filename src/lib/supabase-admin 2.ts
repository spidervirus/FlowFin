import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

/**
 * Creates a Supabase admin client with the service role key.
 * This should ONLY be used in server-side code, never in client components.
 * The service role key has full access to your database without any RLS restrictions.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase URL or Service Role Key is missing");
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey);
}
