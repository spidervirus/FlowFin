import { createClient } from '@supabase/supabase-js';

// Create a singleton instance
let supabaseInstance: ReturnType<typeof createClient> | null = null;

/**
 * Creates a Supabase client with the correct headers to avoid 406 errors
 * when accessing the company_settings table.
 * Uses a singleton pattern to avoid multiple instances.
 */
export function createSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance;
  }
  
  supabaseInstance = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          'Accept': 'application/json, application/vnd.pgrst.object+json',
          'Content-Type': 'application/json',
          'X-Client-Info': 'supabase-js/2.38.4',
        },
      },
      auth: {
        persistSession: true, // Changed to true to maintain session
        storageKey: 'flowfin-auth-storage',
      },
    }
  );
  
  return supabaseInstance;
} 