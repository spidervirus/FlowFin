import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import * as z from 'zod';

import { 
  apiSuccess, 
  apiError, 
  ApiErrorCode 
} from '@/lib/api/api-response';
import { validateBody } from '@/lib/api/validate-request';
import { withRateLimit, rateLimits } from '@/lib/api/rate-limit';
import { withTimeout } from '@/lib/utils/async-utils';
import { 
  AuthenticationError, 
  ValidationError, 
  ServiceUnavailableError 
} from '@/lib/api/api-error';

// Get the Supabase project reference for consistent cookie naming
function getAuthCookieName(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return 'sb-default-auth-token';
  
  const matches = supabaseUrl.match(/(?:db|api)\.([^.]+)\.supabase\./);
  return `sb-${matches?.[1] ?? 'default'}-auth-token`;
}

// Cookie options for authentication
function getAuthCookieOptions() {
  return {
    name: getAuthCookieName(),
  path: '/',
    sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    domain: undefined,
  };
}

// Validation schema for sign-in requests
const signInSchema = z.object({
  email: z.string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Invalid email format' }),
  password: z.string()
    .min(1, { message: 'Password is required' })
    .min(6, { message: 'Password must be at least 6 characters' }),
});

// Main handler function
async function signInHandler(request: NextRequest) {
  // Generate unique request ID for tracing
  const requestId = crypto.randomUUID();
  
  try {
    // Validate request body using our schema
    const validation = await validateBody(request, signInSchema);
    if (!validation.success) {
      return (validation as { success: false; error: NextResponse<unknown> }).error;
    }
    
    const { email, password } = validation.data;

    // Initialize Supabase client with cookie handling
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    }, {
      cookieOptions: getAuthCookieOptions()
    });

    // Clean up any stale auth cookies
    const cookieName = getAuthCookieName();
    const allCookies = cookieStore.getAll();
    const authCookies = allCookies.filter(c => c.name.includes('-auth-token') && c.name !== cookieName);
    authCookies.forEach(cookie => {
      cookieStore.delete(cookie.name);
    });

    // Use withTimeout utility for safe async operation
    try {
      // Attempt to sign in with timeout protection
      const { data, error } = await withTimeout(
        () => supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password
        }),
        10000, // 10 second timeout
        new ServiceUnavailableError('Authentication service timed out, please try again')
      );

    if (error) {
        // Map Supabase errors to our standard error types
        if (error.message?.includes('rate limit') || error.message?.includes('too many requests')) {
          throw apiError(ApiErrorCode.RATE_LIMIT, 'Too many sign-in attempts. Please try again later.');
        } else if (error.message?.includes('Invalid login credentials')) {
          throw new AuthenticationError('Invalid email or password');
        } else if (error.message?.includes('Email not confirmed')) {
          throw apiError(ApiErrorCode.FORBIDDEN, 'Please verify your email before signing in');
        } else {
          throw new AuthenticationError(error.message);
        }
      }

      // Verify we have a valid session
      if (!data.session || !data.user) {
        throw apiError(
          ApiErrorCode.INTERNAL_ERROR, 
          'Authentication succeeded but no session was created'
        );
      }

      // Create response with session data using our standardized format
      const response = apiSuccess({
      user: data.user,
      session: data.session
    });

    // Ensure cookie is properly set in response
      const authCookie = cookieStore.get(cookieName);
    if (authCookie) {
        const options = getAuthCookieOptions();
      response.cookies.set(authCookie.name, authCookie.value, {
        path: options.path,
        sameSite: options.sameSite,
        secure: options.secure,
        maxAge: options.maxAge,
          httpOnly: options.httpOnly,
      });
    }

    return response;
    } catch (error) {
      // Handle various error types
      if (error instanceof AuthenticationError) {
        return apiError(ApiErrorCode.UNAUTHORIZED, error.message);
      }
      
      if (error instanceof ValidationError) {
        return apiError(ApiErrorCode.VALIDATION_ERROR, error.message, error.details);
      }
      
      if (error instanceof ServiceUnavailableError) {
        return apiError(ApiErrorCode.SERVICE_UNAVAILABLE, error.message);
      }
      
      if ((error as any).name === 'AbortError' || (error as any).message?.includes('timed out')) {
        return apiError(
          ApiErrorCode.SERVICE_UNAVAILABLE, 
          'Sign-in request timed out',
          { requestId }
        );
      }
      
      // If it's already an API error response, just return it
      if ((error as any).status && (error as any).json) {
        return error;
      }
      
      // Default error handling
      console.error(`[Sign-in Error][${requestId}]:`, error);
      return apiError(
        ApiErrorCode.INTERNAL_ERROR, 
        'An unexpected error occurred during authentication',
        { requestId }
      );
    }
  } catch (error) {
    console.error(`[Sign-in Unhandled Error][${requestId}]:`, error);
    return apiError(
      ApiErrorCode.INTERNAL_ERROR, 
      'An unexpected error occurred',
      { requestId }
    );
  }
}

// Apply rate limiting to the handler
export const POST = withRateLimit(signInHandler as (req: NextRequest) => Promise<ReturnType<typeof apiSuccess>>, rateLimits.auth);