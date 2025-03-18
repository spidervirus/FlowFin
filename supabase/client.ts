'use client';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Create a single supabase client for browser-side usage
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: {
        'Accept': 'application/json, application/vnd.pgrst.object+json',
        'Content-Type': 'application/json',
        'X-Client-Info': 'supabase-js/2.38.4',
      },
    },
  });
};
