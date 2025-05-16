import { createBrowserClient } from "@supabase/ssr";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";
import type { CookieOptions } from '@supabase/ssr';

// Constants
const BASE64_PREFIX = 'base64-';

// Extract project reference from Supabase URL for consistent cookie naming
const getProjectRef = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  
  const matches = supabaseUrl.match(/(?:db|api)\.([^.]+)\.supabase\./);
  return matches?.[1] ?? 'default';
};

const getCookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';
  const domain = isProd ? window.location.hostname : 'localhost';
  
  return {
    name: `sb-${getProjectRef()}-auth-token`,
    domain,
    path: '/',
    sameSite: 'lax',
    secure: isProd,
    maxAge: 100 * 365 * 24 * 60 * 60, // 100 years, never expire
  };
};

const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

const decodeBase64 = (str: string): string => {
  try {
    // Handle URL-safe base64
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    return decodeURIComponent(atob(base64));
  } catch (error) {
    console.error('[Browser] Error decoding base64:', error);
    return str;
  }
};

const parseCookieValue = (value: unknown): string | undefined | null => {
  if (!isString(value)) {
    console.debug('[Browser] Cookie value is not a string:', typeof value);
    return null;
  }
  
  try {
    // First try decoding URI component
    const decodedValue = decodeURIComponent(value);
    console.debug('[Browser] Decoded cookie value:', { original: value, decoded: decodedValue });

    // Handle base64 encoded cookies
    if (decodedValue.startsWith(BASE64_PREFIX)) {
      const base64Value = decodedValue.substring(BASE64_PREFIX.length);
      const decoded = decodeBase64(base64Value);
      console.debug('[Browser] Decoded base64 cookie:', { base64: base64Value, decoded });
      
      // Try parsing as JSON
      try {
        const parsed = JSON.parse(decoded);
        return typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
      } catch (error) {
        console.debug('[Browser] Not a JSON value after base64 decode:', error);
        return decoded;
      }
    }
    
    // Try parsing as JSON
    try {
      const parsed = JSON.parse(decodedValue);
      return typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
    } catch (error) {
      console.debug('[Browser] Not a JSON value:', error);
      // If not JSON, return decoded value as is
      return decodedValue;
    }
  } catch (error) {
    console.error('[Browser] Error parsing cookie:', error);
    // Return original value if decoding fails
    return value;
  }
};

let clientInstance: ReturnType<typeof createBrowserClient> | null = null;

export const createClient = () => {
  if (clientInstance) return clientInstance;

  const cookieOptions = getCookieOptions();
  
  clientInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string): string | undefined | null => {
          try {
            const cookie = document.cookie
              .split('; ')
              .find((row) => row.startsWith(`${name}=`));
            
            if (!cookie) {
              console.debug('[Browser] Cookie not found:', name);
              return null;
            }

            const value = cookie.split('=')[1];
            console.debug('[Browser] Getting cookie:', { name, hasValue: !!value, valueType: typeof value });
            return parseCookieValue(value);
          } catch (error) {
            console.error('[Browser] Error getting cookie:', name, error);
            return null;
          }
        },
        set: (name: string, value: string, options?: CookieOptions): void => {
          try {
            // Don't encode the value here as it may already be encoded
            const cookieValue = `${name}=${value}`;
            const mergedOptions = {
              ...cookieOptions,
              ...options,
            };
            
            const cookieString = Object.entries(mergedOptions)
              .reduce((acc, [key, val]) => {
                if (val === true) return `${acc}; ${key}`;
                if (val === false) return acc;
                return `${acc}; ${key}=${val}`;
              }, cookieValue);
            
            console.debug('[Browser] Setting cookie:', { name, valueType: typeof value });
            document.cookie = cookieString;
          } catch (error) {
            console.error('[Browser] Error setting cookie:', error);
          }
        },
        remove: (name: string, options?: CookieOptions): void => {
          try {
            console.debug('[Browser] Removing cookie:', name);
            const mergedOptions = {
              ...cookieOptions,
              ...options,
              maxAge: -1,
            };
            
            document.cookie = `${name}=; ${Object.entries(mergedOptions)
              .map(([key, value]) => `${key}=${value}`)
              .join('; ')}`;
          } catch (error) {
            console.error('[Browser] Error removing cookie:', error);
          }
        },
      },
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
        storageKey: cookieOptions.name,
      },
    }
  );

  // Add auth state change listener for debugging
  clientInstance.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
    console.debug('[Browser] Auth state changed:', event, 'Session:', !!session, session?.user?.id);
  });

  return clientInstance;
};
