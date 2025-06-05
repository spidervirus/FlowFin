import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cspMiddleware } from "./src/middleware/csp";
import { securityHeaders } from "./src/middleware/security-headers";
import { RateLimiter } from './src/lib/utils/rate-limit';
import { validateCsrfToken } from './src/lib/utils/csrf';

// Implement cookie utilities directly in middleware - DO NOT import from client-side
// This avoids any possible hook usage in middleware
// Extract project reference from Supabase URL for consistent cookie naming
// We can't directly import client-side utils, so we implement the core functions here
function getAuthCookieName(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return "sb-default-auth-token";

  const matches = supabaseUrl.match(/(?:db|api)\.([^.]+)\.supabase\./);
  return `sb-${matches?.[1] ?? "default"}-auth-token`;
}

function getAuthCookieOptions(): {
  name: string;
  domain: string | undefined;
  path: string;
  sameSite: "lax";
  secure: boolean;
  maxAge: number;
} {
  return {
    name: getAuthCookieName(),
    domain: process.env.NODE_ENV === 'production' ? process.env.NEXT_PUBLIC_SITE_URL?.replace('https://', '') : undefined,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };
}

interface LogError {
  message: string;
  path?: string;
  timestamp?: string;
}

interface Logger {
  error: (message: string, error: LogError) => void;
  info: (message: string, data?: any) => void;
  debug: (message: string, data?: any) => void;
}

const logger: Logger = {
  error: function (message: string, error: LogError): void {
    console.error(message, error);
  },
  info: function (message: string, data?: any): void {
    console.info(message, data);
  },
  debug: function (message: string, data?: any): void {
    if (process.env.DEBUG === "true") {
      console.debug(message, data);
    }
  },
};

// Define routes that don't require authentication
const publicRoutes = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/verify",
  "/",
  "/about",
  "/features",
  "/pricing",
  "/resources",
  "/public",
  "/api/public",
  "/static",
  "/legal",
  "/terms",
  "/privacy",
];

// Define routes that are only accessible when not authenticated
const authRoutes = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
];

export async function middleware(req: NextRequest) {
  const requestStart = Date.now();
  let res = NextResponse.next();
  
  // Apply security middleware first
  res = securityHeaders(req).headers ? securityHeaders(req) : res;
  res = cspMiddleware(req).headers ? cspMiddleware(req) : res;

  // --- Rate limiting for auth endpoints ---
  const authEndpoints = ['/sign-in', '/sign-up', '/api/auth/signin', '/api/auth/signup'];
  if (authEndpoints.some((route) => req.nextUrl.pathname.startsWith(route))) {
    const rateLimiter = new RateLimiter();
    const rateLimitResult = await rateLimiter.check(req, 'auth');
    if (!rateLimitResult.success) {
      return new NextResponse('Too many authentication attempts. Please try again later.', {
        status: 429,
      });
    }
  }

  // --- CSRF protection for state-changing requests ---
  const method = req.method.toUpperCase();
  const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
  if (isStateChanging && !publicRoutes.some((route) => req.nextUrl.pathname.startsWith(route))) {
    const csrfResult = await validateCsrfToken(req);
    if (!csrfResult.success) {
      // Sanitize error message for redirect
      const safeError = encodeURIComponent(csrfResult.error || 'Invalid CSRF token');
      return NextResponse.redirect(new URL(`/sign-in?error=${safeError}`, req.url));
    }
  }

  // Create Supabase client with consistent cookie options
  const supabase = createMiddlewareClient(
    { req, res },
    {
      cookieOptions: getAuthCookieOptions(),
    },
  );

  try {
    // Log incoming request
    logger.info("Incoming request", {
      method: req.method,
      url: req.url,
      pathname: req.nextUrl.pathname,
    });

    // Add request ID for tracking
    const requestId = crypto.randomUUID();
    res.headers.set("x-request-id", requestId);

    // Get session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      logger.error("Session error in middleware", {
        message: sessionError.message,
        path: req.nextUrl.pathname,
        timestamp: new Date().toISOString(),
      });

      // Check if error is related to cookies
      if (
        sessionError.message.includes("cookie") ||
        sessionError.message.includes("token")
      ) {
        const cookieName = getAuthCookieName();
        logger.debug("Cookie-related error detected", {
          cookies: req.cookies.getAll().map((c) => c.name),
          hasAuthCookie: req.cookies.has(cookieName),
          cookieName,
        });

        // Clean up any corrupted cookies
        if (req.cookies.has(cookieName)) {
          res.cookies.delete(cookieName);
          logger.debug("Deleted potentially corrupted auth cookie", {
            cookieName,
          });
        }
      }
    }

    // Log cookie information for debugging
    const cookieName = getAuthCookieName();
    logger.debug("Cookie state in middleware", {
      pathname: req.nextUrl.pathname,
      hasAuthCookie: req.cookies.has(cookieName),
      cookieName,
      cookieCount: req.cookies.size,
      allCookies: req.cookies.getAll().map((c) => c.name),
    });

    // Check for and clean up any stale auth cookies
    const authCookies = req.cookies
      .getAll()
      .filter((c) => c.name.includes("-auth-token") && c.name !== cookieName);
    if (authCookies.length > 0) {
      logger.debug("Found stale auth cookies", {
        staleAuthCookies: authCookies.map((c) => c.name),
      });

      // Clean up stale auth cookies
      authCookies.forEach((cookie) => {
        res.cookies.delete(cookie.name);
      });
    }

    // Handle auth routes (sign-in, sign-up, etc.)
    if (authRoutes.some((route) => req.nextUrl.pathname.startsWith(route))) {
      if (session) {
        // Redirect to dashboard if already authenticated
        logger.info("Redirecting authenticated user from auth route", {
          path: req.nextUrl.pathname,
          userId: session.user.id,
        });
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      return res;
    }

    // Handle protected routes
    if (
      !req.nextUrl.pathname.startsWith("/_next") &&
      !publicRoutes.some((route) => req.nextUrl.pathname.startsWith(route))
    ) {
      if (!session) {
        // Store the original URL for redirect after sign in
        const redirectUrl = req.nextUrl.pathname + req.nextUrl.search;
        logger.info("Redirecting unauthenticated user to sign-in", {
          from: redirectUrl,
        });
        return NextResponse.redirect(
          new URL(
            `/sign-in?redirectUrl=${encodeURIComponent(redirectUrl)}`,
            req.url,
          ),
        );
      }

      // Refresh session if we have one
      try {
        // Use a simpler timeout approach to avoid React-hook-like patterns
        let timeoutId: NodeJS.Timeout | null = null;
        let refreshCompleted = false;

        // Create a promise that will reject after timeout
        const refreshWithTimeout = new Promise<any>(async (resolve, reject) => {
          // Set timeout
          timeoutId = setTimeout(() => {
            if (!refreshCompleted) {
              reject(new Error("Session refresh timeout"));
            }
          }, 5000); // 5 second timeout

          try {
            // Attempt refresh
            const result = await supabase.auth.refreshSession();
            refreshCompleted = true;
            if (timeoutId) clearTimeout(timeoutId);
            resolve(result);
          } catch (err) {
            refreshCompleted = true;
            if (timeoutId) clearTimeout(timeoutId);
            reject(err);
          }
        });

        // Await the refresh with timeout
        const { data: refreshData, error: refreshError } =
          await refreshWithTimeout.catch((err) => ({
            data: { session: null },
            error: { message: err.message || "Session refresh timeout" },
          }));

        if (refreshError) {
          logger.error("Session refresh error", {
            message: refreshError.message,
            path: req.nextUrl.pathname,
            timestamp: new Date().toISOString(),
          });

          // Only redirect on certain types of refresh errors
          if (
            refreshError.message.includes("expired") ||
            refreshError.message.includes("invalid") ||
            refreshError.message.includes("not found") ||
            refreshError.message.includes("timeout")
          ) {
            // Clean up auth cookie on serious errors
            const cookieName = getAuthCookieName();
            if (req.cookies.has(cookieName)) {
              logger.debug("Clearing auth cookie due to refresh error", {
                cookieName,
              });
              res.cookies.delete(cookieName);
            }

            logger.info("Redirecting due to session refresh error", {
              error: refreshError.message,
            });
            return NextResponse.redirect(new URL("/sign-in", req.url));
          }
        } else if (refreshData.session) {
          logger.debug("Session refreshed successfully", {
            userId: refreshData.session?.user.id,
            expiresAt: refreshData.session?.expires_at,
            expires_in: refreshData.session
              ? Math.floor(
                  (new Date(refreshData.session.expires_at * 1000).getTime() -
                    Date.now()) /
                    1000,
                )
              : "unknown",
          });
        }
      } catch (error) {
        logger.error("Unexpected error during session refresh", {
          message: error instanceof Error ? error.message : "Unknown error",
          path: req.nextUrl.pathname,
          timestamp: new Date().toISOString(),
        });

        // On serious refresh errors, redirect to sign-in
        if (
          error instanceof Error &&
          (error.message.includes("timeout") ||
            error.message.includes("aborted"))
        ) {
          logger.info("Redirecting due to session refresh timeout");
          return NextResponse.redirect(
            new URL("/sign-in?error=Session refresh failed", req.url),
          );
        }
      }
    }

    // Log response time
    const duration = Date.now() - requestStart;
    logger.info("Request completed", {
      requestId,
      duration,
      status: res.status,
      pathname: req.nextUrl.pathname,
    });

    return res;
  } catch (error) {
    logger.error("Middleware error", {
      message: error instanceof Error ? error.message : "Unknown error",
      path: req.nextUrl.pathname,
      timestamp: new Date().toISOString(),
    });

    // Check if error is related to cookies
    if (
      error instanceof Error &&
      (error.message.includes("cookie") || error.message.includes("token"))
    ) {
      const cookieName = getAuthCookieName();
      logger.debug("Cookie-related middleware error", {
        cookies: req.cookies.getAll().map((c) => c.name),
        hasAuthCookie: req.cookies.has(cookieName),
        cookieName,
        errorMessage: error.message,
      });

      // Clear auth cookie if it's corrupted
      const redirectResponse = NextResponse.redirect(
        new URL("/sign-in?error=Session expired", req.url),
      );

      // Delete the specific auth cookie and any other auth-related cookies
      redirectResponse.cookies.delete(cookieName);

      // Also clear any stale auth cookies
      const authCookies = req.cookies
        .getAll()
        .filter((c) => c.name.includes("-auth-token") && c.name !== cookieName);
      authCookies.forEach((cookie) => {
        redirectResponse.cookies.delete(cookie.name);
      });

      logger.debug("Cleared auth cookies before redirect", {
        clearedCookies: [cookieName, ...authCookies.map((c) => c.name)],
      });

      return redirectResponse;
    }

    return NextResponse.redirect(
      new URL("/sign-in?error=Authentication error", req.url),
    );
  }
}

// Specify which routes to run the middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     * - manifest files
     * - robots.txt
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|manifest.json|manifest.webmanifest|site.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
