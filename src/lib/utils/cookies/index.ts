import { CookieOptions as SupabaseCookieOptions } from '@supabase/auth-helpers-shared';
import { getCookie, setCookie as setNextCookie, deleteCookie as deleteNextCookie, hasCookie } from 'cookies-next';

/**
 * Cookie utilities for handling authentication cookies
 * These functions use cookies-next for better cookie management
 */

/**
 * Extract project reference from Supabase URL for consistent cookie naming
 */
export function getProjectRef(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return 'default';
  
  // Handle local development URLs
  if (supabaseUrl.includes('localhost') || /^https?:\/\/\d+\.\d+\.\d+\.\d+/.test(supabaseUrl)) {
    return 'local';
  }
  
  // Handle cloud Supabase URLs
  const matches = supabaseUrl.match(/(?:db|api)\.([^.]+)\.supabase\./); 
  return matches?.[1] ?? 'default';
}

/**
 * Get the standardized auth cookie name
 */
export function getAuthCookieName(): string {
  return `sb-${getProjectRef()}-auth-token`;
}

/**
 * Get consistent cookie options to use across the application
 * Returns cookie options compatible with Supabase's requirements
 */
export function getAuthCookieOptions(overrides: Partial<SupabaseCookieOptions> = {}): SupabaseCookieOptions {
  const options: SupabaseCookieOptions = {
    domain: getProperCookieDomain(),
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    ...overrides
  };

  console.debug('[Cookie Utils] Generated cookie options:', {
    ...options,
    environment: process.env.NODE_ENV,
    isClient: typeof window !== 'undefined'
  });

  return options;
}

/**
 * Get all cookies
 */
export function getAllCookies(): { [key: string]: any } {
  // Since cookies-next doesn't have a direct method to get all cookies,
  // we'll need to implement this differently or remove it if not needed
  return {};
}

/**
 * Check if auth cookie exists
 */
export async function hasAuthCookie(): Promise<boolean> {
  const cookieName = getAuthCookieName();
  const exists = await hasCookie(cookieName);
  
  console.debug('[Cookie Utils] Checking auth cookie:', {
    cookieName,
    exists
  });
  
  return exists;
}

/**
 * Set a cookie with the specified options
 */
export function setCookie(name: string, value: string, options: Partial<SupabaseCookieOptions> = {}): void {
  const defaultOptions: Partial<SupabaseCookieOptions> = {
    path: '/',
    domain: getProperCookieDomain(),
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  };
  setNextCookie(name, value, { ...defaultOptions, ...options });
}

/**
 * Delete a cookie by name
 */
export function deleteCookie(name: string, options: Partial<SupabaseCookieOptions> = {}): void {
  const defaultOptions: Partial<SupabaseCookieOptions> = {
    path: '/',
    domain: getProperCookieDomain(),
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  };
  deleteNextCookie(name, { ...defaultOptions, ...options });
}

/**
 * Clear the auth cookie
 */
export function clearAuthCookie(): void {
  const cookieName = getAuthCookieName();
  const options: Partial<SupabaseCookieOptions> = {
    path: '/',
    domain: getProperCookieDomain(),
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  };
  deleteNextCookie(cookieName, options);
}

/**
 * Log cookie debug information (client-side)
 */
export function logCookieDebugInfo(prefix = 'Cookie Debug'): void {
  if (typeof document === 'undefined') return;
  
  const cookieName = getAuthCookieName();
  const cookies = document.cookie.split(';').map(c => c.trim());
  const hasCookie = cookies.some(c => c.startsWith(`${cookieName}=`));
  
  console.debug(`[${prefix}]`, {
    cookieName,
    hasCookie,
    cookieCount: cookies.length,
    allCookies: cookies.map(c => c.split('=')[0])
  });
}

/**
 * Fix cookie domain for production environments
 */
export function getProperCookieDomain(): string | undefined {
  if (process.env.NODE_ENV !== 'production') return undefined;
  
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Only set domain for non-localhost domains
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // If it's a subdomain, we need to include the main domain
      const parts = hostname.split('.');
      if (parts.length > 2) {
        // Return the main domain with subdomain removed
        return parts.slice(parts.length - 2).join('.');
      }
      return hostname;
    }
  }
  
  return undefined;
}

/**
 * Cookie issue information
 */
interface CookieIssueResult {
  hasIssues: boolean;
  issues: string[];
}

/**
 * Check for and identify potential cookie issues
 */
export function diagnoseCookieIssues(): CookieIssueResult {
  const issues: string[] = [];
  
  if (typeof document === 'undefined') {
    return { hasIssues: false, issues: ['Cannot diagnose cookies in server environment'] };
  }
  
  const cookieName = getAuthCookieName();
  const cookies = document.cookie.split(';').map(c => c.trim());
  const authCookies = cookies.filter(c => c.startsWith(`${cookieName}=`));
  
  if (authCookies.length === 0) {
    issues.push('No auth cookie found');
  } else if (authCookies.length > 1) {
    issues.push('Multiple auth cookies found with the same name');
  }
  
  // Check if cookie is very large (might be truncated)
  const authCookie = authCookies[0];
  if (authCookie && authCookie.length > 4000) {
    issues.push('Auth cookie is very large and might be truncated');
  }
  
  // Look for similar but not exact cookie names (potential misconfiguration)
  const similarCookies = cookies.filter(c => 
    c.includes('-auth-token') && !c.startsWith(`${cookieName}=`)
  );
  
  if (similarCookies.length > 0) {
    issues.push('Found similar auth cookies with different names');
  }
  
  return {
    hasIssues: issues.length > 0,
    issues
  };
}



/**
 * Get a cookie by name
 */