import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = async () => {
  const cookieStore = cookies();

  // Get Supabase URL and anon key from environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Check if environment variables are available
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase environment variables are missing');
    throw new Error('Supabase environment variables are missing');
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle cookies in edge functions
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // Handle cookies in edge functions
          }
        },
      },
    }
  );
};

export const createServiceRoleClient = () => {
  // Get Supabase URL and service role key from environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Check if environment variables are available
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Supabase service role environment variables are missing');
    throw new Error('Supabase service role environment variables are missing. Check your .env.local file.');
  }

  return createServerClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      cookies: {
        get(name: string) {
          return undefined // Service role client doesn't need cookies
        },
        set(name: string, value: string, options: any) {
          // Service role client doesn't need to set cookies
        },
        remove(name: string, options: any) {
          // Service role client doesn't need to remove cookies
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
};
