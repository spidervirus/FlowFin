import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Create Supabase client
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

  // Check if the user is authenticated through Supabase Auth
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If the user is authenticated through Supabase Auth, proceed
  if (session) {
    return response;
  }

  // If not authenticated through Supabase Auth, check for bypass session
  const bypassSessionId = request.cookies.get('bypass_session_id')?.value;
  const bypassUserId = request.cookies.get('bypass_user_id')?.value;

  // If bypass session cookies exist, check if the session is valid
  if (bypassSessionId && bypassUserId) {
    // Create a service role client to check the session
    // Note: In a real implementation, you would use a server-side API route
    // to validate the session instead of exposing the service role key in middleware
    const serviceRoleClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

  // If no authentication and trying to access protected routes, redirect to sign-in
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const url = new URL('/sign-in', request.url);
    return NextResponse.redirect(url);
  }

  return response;
}

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
}; 