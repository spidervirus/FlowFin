"use client"

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { type Database } from './database.types'
import { type SupabaseClient } from '@supabase/supabase-js'
import {
  getAuthCookieOptions,
  getAuthCookieName,
  getAllCookies,
  hasAuthCookie,
  clearAuthCookie,
  logCookieDebugInfo,
  diagnoseCookieIssues
} from '@/lib/utils/cookies'

let supabaseInstance: SupabaseClient<Database> | null = null

export function createClient() {
  if (supabaseInstance) {
    return supabaseInstance
  }

  // Create a client component client for client-side
  supabaseInstance = createClientComponentClient<Database>({
    cookieOptions: {
      ...getAuthCookieOptions(),
      domain: undefined,
      secure: !!process.env.NODE_ENV && process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax' as const,
    }
  })

  // Add debug listener for auth state changes
  if (supabaseInstance) {
    // Use a simple function to check cookies to avoid hook-like patterns
    const checkCookieState = (event: string, session: any) => {
      try {
        const cookieName = getAuthCookieName();
        // Get cookies directly from document.cookie rather than using utility functions that might resemble hooks
        const allCookies = typeof document !== 'undefined' ? document.cookie.split(';').map(c => c.trim().split('=')[0]) : [];
        const hasCookie = typeof document !== 'undefined' ? document.cookie.includes(cookieName) : false;
      
      console.debug('[Supabase Client Debug] Auth state changed:', {
        event,
        hasSession: !!session,
        userId: session?.user?.id,
        accessToken: session?.access_token ? '[REDACTED]' : undefined,
        hasCookie,
        cookieName,
          allCookies
        });
      
      // Detect potential cookie inconsistencies
      if (!!session && !hasCookie) {
          console.warn('[Supabase Client Debug] Cookie inconsistency: Session exists but no auth cookie found');
          // Direct implementation instead of using utility that might look like a hook
          const cookieIssues = [];
          if (allCookies.length === 0) cookieIssues.push('No cookies found');
          if (allCookies.some(c => c.includes('-auth-token') && c !== cookieName)) {
            cookieIssues.push('Found similar auth cookies with different names');
          }
          
          if (cookieIssues.length > 0) {
            console.warn('[Supabase Client Debug] Cookie issues detected:', cookieIssues);
          }
      } else if (!session && hasCookie) {
          console.warn('[Supabase Client Debug] Cookie inconsistency: No session but auth cookie exists');
        }
      } catch (error) {
        console.error('[Supabase Client Debug] Error checking cookie state:', error);
      }
    };
    
    supabaseInstance.auth.onAuthStateChange(checkCookieState);
  }

  return supabaseInstance
}

// Export a singleton instance for client-side
export const supabase = createClient()

// Helper to reset the client
export function resetClient() {
  if (!supabaseInstance) {
    return
  }
  
  console.debug('[Supabase Client Debug] Resetting Supabase client instance')
  
  // Clear the session before resetting
  try {
    // Use a regular timeout instead of Promise.race to avoid potential React hook rule violations
    let timeoutId: any = null;
    const signOutPromise = supabaseInstance.auth.signOut({ scope: 'local' });
      
    // Set a timeout that cancels if signOut completes
    timeoutId = setTimeout(() => {
      console.debug('[Supabase Client Debug] Sign out timeout during reset');
      timeoutId = null;
    }, 2000); // 2 second timeout
      
    // Clear timeout when signOut completes
    signOutPromise
      .then(() => {
        if (timeoutId) clearTimeout(timeoutId);
        console.debug('[Supabase Client Debug] Session cleared during reset');
      })
      .catch(err => {
        if (timeoutId) clearTimeout(timeoutId);
        console.error('[Supabase Client Debug] Error clearing session during reset:', err);
      });
  } catch (error) {
    console.error('[Supabase Client Debug] Exception during client reset:', error)
  }
  
  // Reset instance
  supabaseInstance = null
  
  // Manually clear any stale cookies
  clearAuthCookie();
      console.debug('[Supabase Client Debug] Manually cleared auth cookie during reset')
  
  // Log cookie state after reset
  logCookieDebugInfo('Supabase Client Reset');
}

// Manual cookie cleanup function that can be called during debugging
// This is a plain utility function with no hooks dependency
export function cleanupAuthCookies() {
  if (typeof document === 'undefined') return { success: false, message: 'Cannot clean cookies in server environment' }
  
  try {
    // Clear auth cookie using our utility function
    clearAuthCookie();
  console.debug('[Supabase Client Debug] Auth cookies manually cleaned up')
  
    // Simple check if cookie was successfully cleared - avoid any pattern that looks like a hook
    const cookieName = getAuthCookieName();
    const cookieExists = document.cookie.split(';').some(c => c.trim().startsWith(`${cookieName}=`));
    
    return { 
      success: !cookieExists, 
      message: cookieExists ? 'Failed to clear auth cookies' : 'Auth cookies cleared' 
    }
  } catch (error) {
    console.error('[Supabase Client Debug] Error cleaning cookies:', error);
    return { success: false, message: 'Error cleaning cookies' }
  }
}

// Type-safe database interface
export type { SupabaseClient }
