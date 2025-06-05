import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { CookieOptions } from "@supabase/ssr/dist/main/types";

// Server-side implementation of auth cookie utilities
function getAuthCookieName(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return 'sb-default-auth-token';
  
  const matches = supabaseUrl.match(/(?:db|api)\.([^.]+)\.supabase\./);
  return `sb-${matches?.[1] ?? 'default'}-auth-token`;
}

function getCookieOptions(): CookieOptions {
  const isProd = process.env.NODE_ENV === 'production';
  const domain = isProd ? process.env.NEXT_PUBLIC_SITE_URL?.replace('https://', '') : undefined;

  // Normalize sameSite to only 'lax', 'strict', or 'none'
  let sameSite: 'lax' | 'strict' | 'none' = 'lax';
  const envSameSite = process.env.NEXT_PUBLIC_COOKIE_SAMESITE;
  if (envSameSite === 'strict' || envSameSite === 'none') {
    sameSite = envSameSite;
  }
  
  return {
    domain,
    path: '/',
    sameSite,
    secure: isProd,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
  };
}

export function createClient() {
  const cookieStore = cookies();

  // Get Supabase URL and anon key from environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Check if environment variables are available
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase environment variables are missing");
    throw new Error("Supabase environment variables are missing");
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: async () => {
        try {
          // cookies().getAll() returns an array of { name, value }
          return cookieStore.getAll().map(({ name, value }) => ({ name, value }));
        } catch (error) {
          console.error('[Server] Error getting all cookies:', error);
          return [];
        }
      },
      setAll: async (cookiesToSet: { name: string; value: string; options?: CookieOptions | undefined }[]) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            // Normalize sameSite to only 'lax' | 'strict' | 'none' | undefined
            let normalizedOptions: { [key: string]: any } = { ...options };
            if ('sameSite' in normalizedOptions) {
              if (normalizedOptions.sameSite === true) normalizedOptions.sameSite = 'strict';
              else if (normalizedOptions.sameSite === false) normalizedOptions.sameSite = undefined;
              else if (
                normalizedOptions.sameSite !== 'lax' &&
                normalizedOptions.sameSite !== 'strict' &&
                normalizedOptions.sameSite !== 'none'
              ) {
                normalizedOptions.sameSite = undefined;
              }
            }
          const cookieOptions = {
            ...getCookieOptions(),
              ...normalizedOptions,
            } as CookieOptions;
            cookieStore.set({ name, value, ...cookieOptions });
          }
        } catch (error) {
          console.error('[Server] Error setting all cookies:', error);
        }
      },
    },
    auth: {
      detectSessionInUrl: true,
      persistSession: true,
    },
  });
}

export function createServiceRoleClient() {
  // Get Supabase URL and service role key from environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Check if environment variables are available
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("Supabase service role environment variables are missing");
    throw new Error(
      "Supabase service role environment variables are missing. Check your .env.local file."
    );
  }

  return createServerClient(supabaseUrl, supabaseServiceRoleKey, {
    cookies: {
      getAll: async () => [],
      setAll: async (_cookiesToSet: { name: string; value: string; options?: CookieOptions | undefined }[]) => {
        // No-op for service role client
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        'x-client-type': 'service-role',
      },
    },
  });
}