"use client";

/**
 * Cookie utilities for handling authentication cookies
 * These functions are plain utility functions with NO React dependencies
 */

/**
 * Extract project reference from Supabase URL for consistent cookie naming
 */
export function getProjectRef(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return 'default';
  
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
 * Cookie options type
 */
interface CookieOptions {
  path?: string;
  domain?: string;
  maxAge?: number;
  expires?: string | Date;
  sameSite?: 'strict' | 'lax' | 'none';
  secure?: boolean;
  httpOnly?: boolean;
  [key: string]: any;
}

/**
 * Get consistent cookie options to use across the application
 */
export function getAuthCookieOptions(overrides: CookieOptions = {}): CookieOptions {
  return {
    name: getAuthCookieName(),
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    ...overrides
  };
}

/**
 * Get all cookies as an array (client-side)
 */
export function getAllCookies(): string[] {
  if (typeof document === 'undefined') return [];
  return document.cookie.split(';').map(c => c.trim().split('=')[0]);
}

/**
 * Check if auth cookie exists (client-side)
 */
export function hasAuthCookie(): boolean {
  if (typeof document === 'undefined') return false;
  const cookieName = getAuthCookieName();
  return document.cookie.split(';').some(c => c.trim().startsWith(`${cookieName}=`));
}

/**
 * Clear the auth cookie (client-side)
 */
export function clearAuthCookie(): void {
  if (typeof document === 'undefined') return;
  const cookieName = getAuthCookieName();
  document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
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
 * Set a cookie with the given name, value, and options.
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (typeof document === 'undefined') return;
  
  const cookieOptions = {
    path: '/',
    ...options
  };
  
  let cookieString = `${name}=${encodeURIComponent(value)}`;
  
  if (cookieOptions.path) {
    cookieString += `; path=${cookieOptions.path}`;
  }
  
  if (cookieOptions.maxAge) {
    cookieString += `; max-age=${cookieOptions.maxAge}`;
  }
  
  if (cookieOptions.expires) {
    const expires = typeof cookieOptions.expires === 'string' 
      ? cookieOptions.expires 
      : cookieOptions.expires.toUTCString();
    cookieString += `; expires=${expires}`;
  }
  
  if (cookieOptions.domain) {
    cookieString += `; domain=${cookieOptions.domain}`;
  }
  
  if (cookieOptions.secure) {
    cookieString += '; secure';
  }
  
  if (cookieOptions.sameSite) {
    cookieString += `; samesite=${cookieOptions.sameSite}`;
  }
  
  if (cookieOptions.httpOnly) {
    cookieString += '; httponly';
  }
  
  document.cookie = cookieString;
}

/**
 * Get a cookie by name
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  
  return null;
}

/**
 * Delete a cookie by name
 */
export function deleteCookie(name: string, path = '/'): void {
  if (typeof document === 'undefined') return;
  
  document.cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}