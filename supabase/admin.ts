import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// This client uses the SUPABASE_SERVICE_ROLE_KEY which bypasses Row Level Security
// IMPORTANT: This should only be used in server-side code and never exposed to the client
export const createAdminClient = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing Supabase service role key or URL. Make sure these are set in your environment variables.');
    throw new Error('Missing Supabase service role key or URL');
  }
  
  // Create a Supabase client with the service role key
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'x-supabase-admin': 'true',
      },
    },
  });
  
  return supabase;
}; 