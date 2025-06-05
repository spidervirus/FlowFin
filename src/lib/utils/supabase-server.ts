import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getAuthCookieName, getAuthCookieOptions } from '@/lib/utils/cookies';

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
  
  // Use centralized cookie options
  const cookieOptions = getAuthCookieOptions();
  
  // Create client using cookies for session management
  const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // autoRefreshToken, persistSession, etc. can go here if needed
      storage: {
        getItem(key: string) {
          if (!cookieStore) return null;
          const cookie = cookieStore.get(key);
          return cookie?.value ?? null;
      },
        setItem(key: string, value: string) { // Supabase's setItem for storage typically doesn't pass full cookie options here
        if (!cookieStore) return;
          // The 'key' here is usually the session object stringified.
          // The cookie name for the session is often standard (e.g., sb-access-token, sb-refresh-token) or configured by Supabase.
          // We use getAuthCookieName() for our primary auth token cookie.
          // Supabase internal calls to setItem might need specific cookie names for different tokens (access, refresh).
          // For simplicity, if key is the generic session, use our standard name and defaults.
          // A more robust solution might inspect the key or handle Supabase's specific requirements for different tokens if they vary.
          cookieStore.set({ 
            name: getAuthCookieName(), // Using the standard name for the session cookie
            value, 
            ...cookieOptions 
            // Supabase might provide its own maxAge via different mechanisms or defaults for session/refresh tokens
          });
      },
        removeItem(key: string) { // Similar to setItem, key identifies what to remove
        if (!cookieStore) return;
          cookieStore.set({ 
            name: getAuthCookieName(), // Assuming key corresponds to our main auth cookie
            value: '', 
            ...cookieOptions, 
            maxAge: 0 
          });
      },
    },
    },
  });
  
  return supabase;
}



/**
 * Create a Supabase client with service role privileges
 */
export function createServiceRoleClient() {
  return createClient({ serviceRole: true });
}