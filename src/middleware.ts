import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthCookieName } from '@/lib/utils/cookies';

// Define routes that don't require authentication
const PUBLIC_PATHS = [
  "/",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/setup",
  "/static-setup",
  "/setup-redirect",
];

// Track redirect counts to prevent loops
const REDIRECT_COUNTS = new Map<string, { count: number; timestamp: number }>();
const MAX_REDIRECTS = 3;
const REDIRECT_WINDOW = 30000; // 30 seconds

// Track auth state transitions to prevent loops
const AUTH_TRANSITIONS = new Map<string, { 
  lastTransition: string; 
  timestamp: number;
  count: number;
}>();

// Get a stable client ID for tracking redirects
function getClientId(req: NextRequest): string {
  // Try to get a stable identifier in order of preference
  const token = req.cookies.get('sb-access-token')?.value;
  const sessionId = req.cookies.get(getAuthCookieName())?.value;
  const cfConnecting = req.headers.get('cf-connecting-ip');
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0];
  const ip = req.ip;
  
  return token || sessionId || cfConnecting || forwarded || ip || 'anonymous';
}

function checkRedirectLimit(clientId: string, from: string, to: string): boolean {
  const now = Date.now();
  const transitionKey = `${clientId}:${from}:${to}`;
  
  // Clean up old entries
  for (const [key, data] of REDIRECT_COUNTS.entries()) {
    if (now - data.timestamp > REDIRECT_WINDOW) {
      REDIRECT_COUNTS.delete(key);
    }
  }
  
  const redirectData = REDIRECT_COUNTS.get(transitionKey) || { count: 0, timestamp: now };
  
  // Reset count if outside window
  if (now - redirectData.timestamp > REDIRECT_WINDOW) {
    redirectData.count = 0;
    redirectData.timestamp = now;
  }
  
  // Increment count
  redirectData.count++;
  REDIRECT_COUNTS.set(transitionKey, redirectData);
  
  return redirectData.count <= MAX_REDIRECTS;
}

function checkAuthTransition(req: NextRequest, from: string, to: string): boolean {
  const clientId = req.cookies.get('sb-access-token')?.value || req.ip || 'anonymous';
  const now = Date.now();
  const transition = `${from}:${to}`;
  
  // Clean up old entries
  for (const [key, data] of AUTH_TRANSITIONS.entries()) {
    if (now - data.timestamp > REDIRECT_WINDOW) {
      AUTH_TRANSITIONS.delete(key);
    }
  }
  
  const transitionData = AUTH_TRANSITIONS.get(clientId) || { 
    lastTransition: '', 
    timestamp: now,
    count: 0
  };
  
  // Reset if it's a new transition or outside window
  if (transitionData.lastTransition !== transition || 
      now - transitionData.timestamp > REDIRECT_WINDOW) {
    transitionData.count = 0;
    transitionData.timestamp = now;
  }
  
  transitionData.lastTransition = transition;
  transitionData.count++;
  AUTH_TRANSITIONS.set(clientId, transitionData);
  
  return transitionData.count <= MAX_REDIRECTS;
}

function createAuthRedirect(req: NextRequest, path: string) {
  // Check if we're already on the target path
  if (req.nextUrl.pathname === path) {
    console.debug('[Middleware] Already on target path:', path);
    return NextResponse.next();
  }
  
  // Skip redirect if this is a post-auth navigation
  const authState = req.nextUrl.searchParams.get('auth_state');
  if (authState === 'post_signin' || authState === 'post_signout') {
    console.debug('[Middleware] Skipping redirect for post-auth navigation:', { authState, path });
    const response = NextResponse.next();
    // Remove auth_state from URL
    const url = req.nextUrl.clone();
    url.searchParams.delete('auth_state');
    response.headers.set('x-replace-url', url.toString());
    return response;
  }
  
  // Check if this is a client-side navigation
  const isClientNavigation = req.headers.get('accept')?.includes('text/html');
  if (!isClientNavigation) {
    console.debug('[Middleware] Non-HTML request, skipping redirect');
    return NextResponse.next();
  }
  
  // Check redirect limits
  const redirectLimitExceeded = !checkRedirectLimit(getClientId(req), req.nextUrl.pathname, path);
  
  // Construct absolute URL using the request URL as base
  const redirectUrl = req.nextUrl.clone();
  redirectUrl.pathname = path;
  
  // If redirect limit is exceeded, use 303 to force a GET request and prevent caching
  // Otherwise use 307 to preserve the request method
  const response = NextResponse.redirect(redirectUrl, {
    status: redirectLimitExceeded ? 303 : 307
  });
  
  // Add custom headers
  if (redirectLimitExceeded) {
    console.debug('[Middleware] Using forced redirect due to limit exceeded');
    response.headers.set('X-Auth-Force-Redirect', '1');
    
    // Clear any existing redirect tracking for this client
    for (const [key, _] of REDIRECT_COUNTS.entries()) {
      if (key.startsWith(getClientId(req))) {
        REDIRECT_COUNTS.delete(key);
      }
    }
  } else {
    response.headers.set('X-Auth-Redirect', '1');
  }
  
  // Prevent caching of auth redirects
  response.headers.set('Cache-Control', 'no-store, must-revalidate, private');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  try {
    // Skip middleware for API routes
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return res;
    }

    const supabase = createMiddlewareClient({ req, res });
    const { data: { session } } = await supabase.auth.getSession();
    const pathname = req.nextUrl.pathname;

    // Check if the path is public
    const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));

    // Handle public paths
    if (isPublicPath) {
      if (session && (pathname === '/sign-in' || pathname === '/sign-up')) {
        // Redirect authenticated users from sign-in to dashboard
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
      return res;
    }

    // Handle protected paths
    if (!session) {
      // For regular requests, redirect to sign-in
      const redirectUrl = new URL('/sign-in', req.url);
      if (pathname !== '/') {
        redirectUrl.searchParams.set('returnTo', pathname);
      }
      return NextResponse.redirect(redirectUrl);
    }

    // Check if user has completed organization setup
    if (session && pathname !== '/setup' && pathname !== '/static-setup' && pathname !== '/setup-redirect') {
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (!orgMember && !pathname.startsWith('/setup')) {
        // Redirect to setup if no organization exists
        return NextResponse.redirect(new URL('/setup', req.url));
      }
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return res;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
