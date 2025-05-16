import { createApiResponse } from '@/lib/utils/api-response';
import { validateRequest } from '@/lib/utils/validate-request';
import { rateLimiter } from '@/lib/utils/rate-limit';
import { getCsrfToken, validateCsrfToken } from '@/lib/utils/csrf';
import { createClient } from '@/lib/utils/supabase-server';
import { SignUpSchema } from '@/lib/validation/auth';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const rateLimitResult = await rateLimiter.check(request, 'signup');
    if (!rateLimitResult.success) {
      return createApiResponse(null, rateLimitResult.message || 'Too many requests', 429, {
        'Retry-After': String(rateLimitResult.reset - Math.floor(Date.now() / 1000)),
      });
    }
    
    // CSRF validation
    const csrfResult = await validateCsrfToken(request);
    if (!csrfResult.success) {
      return createApiResponse(null, csrfResult.error || 'Invalid CSRF token', 403);
    }
    
    // Input validation and sanitization
    const body = await request.json();
    const validatedData = await validateRequest(body, SignUpSchema);

    if (!validatedData.success || !validatedData.data) {
      return createApiResponse(null, validatedData.error, 400);
    }

    // Actual signup logic with Supabase
    const { email, password, name } = validatedData.data;
    
    const supabase = createClient();
    
    const { data, error } = await supabase.auth.signUp({
      email,
        password,
      options: {
        data: { 
          full_name: name,
          created_at: new Date().toISOString(),
        }
      }
    });

    if (error) {
      return createApiResponse(null, error.message, 400);
    }

    // Create user profile in the database
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user?.id,
        full_name: name,
        email: email,
      });

    if (profileError) {
      return createApiResponse(null, 'Failed to create user profile', 500);
    }

    // Set secure cookies if needed (fallback to basic cookie setting)
    const sessionData = JSON.stringify({
      userId: data.user?.id,
      email: data.user?.email,
    });
    const cookieStore = cookies();
    cookieStore.set('user_session', sessionData, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    });

    return createApiResponse(
      { 
        user: {
          id: data.user?.id,
          email: data.user?.email,
          name,
        } 
      },
      null,
      201
    );

  } catch (error) {
    console.error('Signup error:', error);
    return createApiResponse(null, 'Internal server error', 500);
  }
}

export async function OPTIONS(request: NextRequest) {
  return createApiResponse(null, null, 204, {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-Token',
  });
}