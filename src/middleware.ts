import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { cookies } from 'next/headers'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseClient } from './lib/supabase-client'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Early return for setup-wizard route - bypass all Supabase checks
  if (request.nextUrl.pathname.startsWith('/setup-wizard')) {
    return response;
  }
  
  // Early return for dashboard route with setupComplete parameter - bypass all Supabase checks
  // This allows the dashboard to load when redirected from the setup wizard
  if (request.nextUrl.pathname.startsWith('/dashboard') && 
      request.nextUrl.searchParams.has('setupComplete')) {
    return response;
  }
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Check auth state
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If user is not authenticated and trying to access protected routes
  if (!session && 
      !request.nextUrl.pathname.startsWith('/sign-in') && 
      !request.nextUrl.pathname.startsWith('/sign-up') && 
      !request.nextUrl.pathname.startsWith('/forgot-password') &&
      !request.nextUrl.pathname.startsWith('/features') &&
      !request.nextUrl.pathname.startsWith('/pricing') &&
      !request.nextUrl.pathname.startsWith('/setup-wizard') && // Allow access to setup wizard without authentication
      !request.nextUrl.pathname.startsWith('/static-setup') && // Allow access to static setup without authentication
      request.nextUrl.pathname !== '/' && // Allow access to index page
      !request.nextUrl.pathname.startsWith('/api/public')) { // Allow public API routes
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  // If user is authenticated
  if (session) {
    // TEMPORARILY DISABLE COMPANY SETTINGS CHECK
    // We'll handle setup completion in the UI instead of middleware
    
    /*
    // Check if user has completed setup (except for the setup page itself and setup wizard)
    if (!request.nextUrl.pathname.startsWith('/setup') && 
        !request.nextUrl.pathname.startsWith('/setup-wizard') &&
        !request.nextUrl.pathname.startsWith('/static-setup')) {
      
      // Only check company_settings if not accessing setup-related pages
      try {
        // Create a Supabase client with the correct headers
        const supabaseWithHeaders = createSupabaseClient();
        
        const { data: settings } = await supabaseWithHeaders
          .from('company_settings')
          .select('id')
          .single();

        // If setup is not completed, redirect to setup
        if (!settings && 
            !request.nextUrl.pathname.startsWith('/sign-in') && 
            !request.nextUrl.pathname.startsWith('/sign-up') && 
            !request.nextUrl.pathname.startsWith('/forgot-password') &&
            !request.nextUrl.pathname.startsWith('/features') &&
            !request.nextUrl.pathname.startsWith('/pricing') &&
            request.nextUrl.pathname !== '/') {
          return NextResponse.redirect(new URL('/setup', request.url));
        }
      } catch (error) {
        console.error('Error checking company settings:', error);
        // Continue without redirecting in case of error
      }
    }
    */

    // If user is authenticated and trying to access auth pages
    if (request.nextUrl.pathname.startsWith('/sign-in') || 
        request.nextUrl.pathname.startsWith('/sign-up') || 
        request.nextUrl.pathname.startsWith('/forgot-password')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // If not authenticated through Supabase Auth, check for bypass session
  const bypassSessionId = request.cookies.get('bypass_session_id')?.value;
  const bypassUserId = request.cookies.get('bypass_user_id')?.value;

  // If bypass session cookies exist, check if the session is valid
  if (bypassSessionId && bypassUserId) {
    // Create a service role client to check the session
    // Note: In a real implementation, you would use a server-side API route
    // to validate the session instead of exposing the service role key in middleware
    const serviceRoleClient = createMiddlewareClient(
      { req: request, res: response },
      { supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY }
    );

    try {
      // Check if the session is valid
      const { data, error } = await serviceRoleClient.from('bypassed_sessions')
        .select('*')
        .eq('id', bypassSessionId)
        .eq('user_id', bypassUserId)
        .single();

      if (error || !data) {
        // Session not found or error, clear cookies and redirect to sign-in
        if (request.nextUrl.pathname.startsWith('/dashboard')) {
          const url = new URL('/sign-in', request.url);
          url.searchParams.set('error', 'Session expired. Please sign in again.');
          
          // Clear cookies
          response.cookies.delete('bypass_session_id');
          response.cookies.delete('bypass_user_id');
          
          return NextResponse.redirect(url);
        }
      }

      // Check if session is expired
      if (data && new Date(data.expires_at) < new Date()) {
        // Session expired, clear cookies and redirect to sign-in
        if (request.nextUrl.pathname.startsWith('/dashboard')) {
          const url = new URL('/sign-in', request.url);
          url.searchParams.set('error', 'Session expired. Please sign in again.');
          
          // Clear cookies
          response.cookies.delete('bypass_session_id');
          response.cookies.delete('bypass_user_id');
          
          return NextResponse.redirect(url);
        }
      }

      // Session is valid, proceed
      return response;
    } catch (error) {
      console.error('Error checking bypass session:', error);
      
      // In case of error, proceed but don't rely on the bypass session
      return response;
    }
  }

  return response
}

// Ensure the middleware is only called for relevant paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - api (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
}

export async function apiMiddleware(request: NextRequest) {
  const requestStart = Date.now();
  
  try {
    // Log incoming request
    logger.info('Incoming request', {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers)
    });

    // Add request ID for tracking
    const requestId = crypto.randomUUID();
    const headers = new Headers(request.headers);
    headers.set('x-request-id', requestId);

    // Continue to the API route
    const response = NextResponse.next({
      request: {
        headers
      }
    });

    // Log response time
    const duration = Date.now() - requestStart;
    logger.info('Request completed', {
      requestId,
      duration,
      status: response.status
    });

    return response;
  } catch (error) {
    // Log error
    logger.error('Middleware error', error instanceof Error ? error : new Error('Unknown error'));

    // Return error response
    return NextResponse.json(
      {
        error: {
          message: 'An unexpected error occurred',
          code: 'INTERNAL_ERROR'
        }
      },
      { status: 500 }
    );
  }
}

// Configure which routes to run middleware on
export const apiConfig = {
  matcher: '/api/:path*'
};
