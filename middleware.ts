import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          res.cookies.set({ name, value: '', ...options });
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
      !request.nextUrl.pathname.startsWith('/auth/callback') &&
      !request.nextUrl.pathname.startsWith('/features') &&
      !request.nextUrl.pathname.startsWith('/pricing') &&
      request.nextUrl.pathname !== '/' && // Allow access to index page
      !request.nextUrl.pathname.startsWith('/api/public')) { // Allow public API routes
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  // If user is authenticated
  if (session) {
    // Check if user has completed setup (except for the setup page itself)
    if (!request.nextUrl.pathname.startsWith('/setup')) {
      const { data: settings } = await supabase
        .from('company_settings')
        .select('id')
        .single()

      // If setup is not completed, redirect to setup
      if (!settings && 
          !request.nextUrl.pathname.startsWith('/sign-in') && 
          !request.nextUrl.pathname.startsWith('/sign-up') && 
          !request.nextUrl.pathname.startsWith('/forgot-password') &&
          !request.nextUrl.pathname.startsWith('/auth/callback') &&
          !request.nextUrl.pathname.startsWith('/features') &&
          !request.nextUrl.pathname.startsWith('/pricing') &&
          request.nextUrl.pathname !== '/') {
        return NextResponse.redirect(new URL('/setup', request.url))
      }
    }

    // If user is authenticated and trying to access auth pages
    if (request.nextUrl.pathname.startsWith('/sign-in') || 
        request.nextUrl.pathname.startsWith('/sign-up') || 
        request.nextUrl.pathname.startsWith('/forgot-password')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
