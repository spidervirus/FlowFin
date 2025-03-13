import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Get Supabase URL and anon key from environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Check if environment variables are available
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase environment variables are missing');
    return res;
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll().map(({ name, value }) => ({
              name,
              value,
            }))
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              req.cookies.set(name, value)
              res.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    // Refresh session if expired - required for Server Components
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Auth session error:', error)
    }
  } catch (error) {
    console.error('Middleware error:', error)
  }

  return res
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
