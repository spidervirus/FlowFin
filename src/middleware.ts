import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { cookies } from 'next/headers'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseClient } from './lib/supabase-client'

// List of public routes that don't require authentication
const publicRoutes = [
  '/',
  '/about',
  '/features',
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  // Get the pathname of the request
  const path = req.nextUrl.pathname;

  // Check if the path is a valid route
  const isValidRoute = publicRoutes.some(route => path === route || path.startsWith('/api/') || path.startsWith('/_next/') || path.startsWith('/static/') || path === '/favicon.ico');

  // If the path is not a valid route and user is not authenticated, redirect to sign-in
  if (!isValidRoute && !session) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  // If user is authenticated and tries to access auth pages, redirect to dashboard
  if (session && (path === '/sign-in' || path === '/sign-up' || path === '/forgot-password')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

// Update matcher to catch all routes
export const config = {
  matcher: [
    // Match all paths except static files and API routes
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};

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
