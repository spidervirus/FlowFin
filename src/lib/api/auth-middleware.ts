/**
 * API Authentication Middleware
 * 
 * This file provides middleware for protecting API routes with authentication.
 * It integrates with Supabase auth and our API response utilities.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { apiUnauthorized } from './api-response';

export type AuthenticatedRequest = NextRequest & {
  auth: {
    userId: string;
    email: string | null;
    roles: string[];
    metadata: Record<string, any>;
    session: any;
  };
};

export type AuthMiddlewareOptions = {
  /**
   * If true, will allow the request to proceed even if unauthenticated, 
   * but will still attach auth info if present.
   */
  optional?: boolean;
  
  /**
   * Required roles for access. If empty, any authenticated user can access.
   */
  requiredRoles?: string[];
};

/**
 * Authentication middleware for API routes
 */
export async function withAuth(
  req: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse> | NextResponse,
  options: AuthMiddlewareOptions = {}
): Promise<NextResponse> {
  const { optional = false, requiredRoles = [] } = options;
  
  try {
    // Create Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    // Handle no session
    if (!session || error) {
      if (optional) {
        // For optional auth, proceed with unauthenticated request
        const unauthReq = req as AuthenticatedRequest;
        unauthReq.auth = {
          userId: '',
          email: null,
          roles: [],
          metadata: {},
          session: null
        };
        return handler(unauthReq);
      } else {
        // For required auth, return 401
        return apiUnauthorized();
      }
    }
    
    // Extract user info
    const { user } = session;
    const roles = (user.app_metadata?.roles || []) as string[];
    
    // Check required roles if specified
    if (requiredRoles.length > 0 && !requiredRoles.some(role => roles.includes(role))) {
      return apiUnauthorized('You do not have the required permissions to access this resource');
    }
    
    // Attach auth info to request
    const authReq = req as AuthenticatedRequest;
    authReq.auth = {
      userId: user.id,
      email: user.email,
      roles,
      metadata: user.user_metadata || {},
      session
    };
    
    // Proceed with authenticated request
    return handler(authReq);
  } catch (error) {
    console.error('Auth middleware error:', error);
    return apiUnauthorized('Failed to validate authentication');
  }
}

/**
 * Create a handler with authentication
 */
export function createAuthHandler(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse> | NextResponse,
  options?: AuthMiddlewareOptions
) {
  return async (req: NextRequest) => {
    return withAuth(req, handler, options);
  };
}

/**
 * Check if a user has the specified role
 */
export function hasRole(req: AuthenticatedRequest, role: string): boolean {
  return req.auth?.roles?.includes(role) || false;
}

/**
 * Check if a user has any of the specified roles
 */
export function hasAnyRole(req: AuthenticatedRequest, roles: string[]): boolean {
  return req.auth?.roles?.some(role => roles.includes(role)) || false;
}

/**
 * Check if a request is authenticated
 */
export function isAuthenticated(req: AuthenticatedRequest): boolean {
  return !!req.auth?.userId;
}