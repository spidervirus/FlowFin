import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthCookieOptions, getAuthCookieName } from '@/lib/utils/cookies';
import { apiSuccess, apiError, ApiErrorCode } from '@/lib/api/api-response';
import { SignUpSchema } from '@/lib/validation/auth';
import { RateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { createProfileWithDebug, ProfileCreationContext } from '@/lib/auth/auth-service';
import { createAdminClient } from '@/lib/supabase/supabase-admin';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('remote-addr');
  const limiter = new RateLimit({
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
    keyPrefix: 'signup:'
  });

  const rateLimitResult = await limiter.check(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;

  try {
    const body = await request.json();
    const validatedData = SignUpSchema.safeParse(body);

    if (!validatedData.success) {
      logger.warn('Sign-up validation failed', validatedData.error.flatten().fieldErrors);
      return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid input data');
    }

    const { email, password, name } = validatedData.data;

    const cookieStore = cookies();
    const cookieOptions = getAuthCookieOptions();

    logger.debug('Sign-up cookie configuration', {
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
      logger.debug('Cleaning up stale auth cookies during sign-up', {
        staleCookies: authCookies.map(c => c.name)
      });

      authCookies.forEach(cookie => {
        cookieStore.delete(cookie.name);
      });
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          created_at: new Date().toISOString(),
        }
      }
    });

    if (signUpError) {
      console.error('Supabase signUp error:', signUpError);
      return apiError(ApiErrorCode.BAD_REQUEST, signUpError.message, undefined, signUpError.status);
    }

    if (!data.user) {
      console.error('Supabase signUp did not return a user object.');
      return apiError(ApiErrorCode.INTERNAL_ERROR, 'User registration failed, no user object returned.');
    }

    // Create user profile with comprehensive debugging and error handling
    const profileContext: ProfileCreationContext = {
      userId: data.user.id,
      email: data.user.email || email,
      name: name,
      fullName: name,
      role: 'user',
      timestamp: new Date().toISOString()
    };

    logger.info('Starting profile creation with debug utilities', profileContext);

    let createdProfile;
    try {
      // Use admin client for profile creation to bypass RLS during signup
      createdProfile = await createProfileWithDebug(profileContext);
      logger.info('Profile created successfully via createProfileWithDebug', {
        profileId: createdProfile.id, // Assuming profile object has an id
        userId: data.user.id
      });
    } catch (profileCreationError: any) {
      logger.error('Profile creation failed via createProfileWithDebug', profileCreationError, {
        context: profileContext,
        errorCode: profileCreationError?.code,
        errorMessage: profileCreationError?.message,
        errorDetails: profileCreationError?.details
      });

      let userMessage = 'Profile creation failed. Please try again.';
      let statusCode = 500;
      let apiErrorCode = ApiErrorCode.INTERNAL_ERROR;

      // Check for specific Supabase error codes or properties
      if (profileCreationError?.code === '23505') { // Unique violation
        userMessage = 'An account with this email or username already exists. Please sign in instead.';
        statusCode = 409;
        apiErrorCode = ApiErrorCode.CONFLICT;
      } else if (profileCreationError?.message?.includes('Row level security')) {
        userMessage = 'Account creation is temporarily unavailable due to security policies. Please contact support.';
        statusCode = 503;
        apiErrorCode = ApiErrorCode.INTERNAL_ERROR; // Or a more specific one if available
      }
      // Add more specific error handling as needed based on common profileCreationError types

      return apiError(apiErrorCode, userMessage, undefined, statusCode);
    }

    // After successful signup, we need to establish a proper Supabase session
    const sessionSupabase = createRouteHandlerClient({
      cookies: () => cookieStore
    });

    // The session is automatically set by the auth-helpers when using createRouteHandlerClient
    // We can now redirect the user to the protected dashboard page
    const redirectUrl = new URL('/dashboard', origin);
    return NextResponse.redirect(redirectUrl.toString(), { status: 303 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Sign-up route handler error', error instanceof Error ? error : new Error(errorMessage), {
      errorType: error?.constructor?.name,
      timestamp: new Date().toISOString()
    });
    return apiError(ApiErrorCode.INTERNAL_ERROR, 'An unexpected error occurred during sign-up. Please try again later.');
  }
}