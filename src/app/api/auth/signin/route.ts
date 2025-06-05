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
import { getAuthCookieOptions, getAuthCookieName } from '@/lib/utils/cookies';



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
  const requestId = crypto.randomUUID();
  
  try {
    const validation = await validateBody(request, signInSchema);
    if (!validation.success) {
      return (validation as { success: false; error: NextResponse<unknown> }).error;
    }
    
    const { email, password } = validation.data;

    const cookieStore = cookies();
    const cookieOptions = getAuthCookieOptions();
    
    console.debug('[Auth API Debug] Sign-in cookie configuration:', {
      requestId,
      cookieConfig: {
        path: cookieOptions.path,
        sameSite: cookieOptions.sameSite,
        secure: cookieOptions.secure
      },
      existingCookies: cookieStore.getAll().map(c => c.name)
    });

    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore
    });

    // Clean up any stale auth cookies
    const cookieName = getAuthCookieName();
    const allCookies = cookieStore.getAll();
    const authCookies = allCookies.filter(c => c.name.includes('-auth-token') && c.name !== cookieName);
    
    if (authCookies.length > 0) {
      console.debug('[Auth API Debug] Cleaning up stale auth cookies:', {
        requestId,
        staleCookies: authCookies.map(c => c.name)
      });
      
      authCookies.forEach(cookie => {
        cookieStore.delete(cookie.name);
      });
    }

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
      response.cookies.set(authCookie.name, authCookie.value, getAuthCookieOptions());
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