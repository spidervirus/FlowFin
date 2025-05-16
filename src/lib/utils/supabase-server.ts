import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Types for creating a supabase client with custom options
type SupabaseClientOptions = {
  cookies?: ReturnType<typeof cookies>;
  serviceRole?: boolean;
};

/**
 * Create a Supabase client with the appropriate configuration for server components
 * @param options Optional configuration for the client
 * @returns Supabase client instance
 */
export function createClient(options: SupabaseClientOptions = {}) {
  const { cookies: cookieStore, serviceRole = false } = options;
  
  // Get required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || (!supabaseAnonKey && !serviceRole)) {
    throw new Error('Missing Supabase environment variables');
  }
  
  // If using service role, create a client with admin privileges
  if (serviceRole) {
    if (!supabaseServiceRoleKey) {
      throw new Error('Missing Supabase service role key');
    }
    
    return createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  
  // Define cookie options
  const cookieOptions = {
    name: getAuthCookieName(),
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  };
  
  // Create client using cookies for session management
  const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        if (!cookieStore) return '';
        const cookie = cookieStore.get(name);
        return cookie?.value;
      },
      set(name: string, value: string, options: any) {
        if (!cookieStore) return;
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: any) {
        if (!cookieStore) return;
        cookieStore.set({ name, value: '', ...options, maxAge: 0 });
      },
    },
    auth: {
      cookieOptions,
    },
  });
  
  return supabase;
}

/**
 * Get the standardized auth cookie name
 */
function getAuthCookieName(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return 'sb-default-auth-token';
  
  const matches = supabaseUrl.match(/(?:db|api)\.([^.]+)\.supabase\./);
  return `sb-${matches?.[1] ?? 'default'}-auth-token`;
}

/**
 * Create a Supabase client with service role privileges
 */
export function createServiceRoleClient() {
  return createClient({ serviceRole: true });
}