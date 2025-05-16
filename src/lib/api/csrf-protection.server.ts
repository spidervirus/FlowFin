import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// Constants
const CSRF_TOKEN_COOKIE = 'csrf_token';
const CSRF_TOKEN_HEADER = 'x-csrf-token';
const CSRF_TOKEN_FORM_FIELD = 'csrfToken';
const CSRF_TOKEN_EXPIRY = 60 * 60 * 2; // 2 hours in seconds

/**
 * Generate a CSRF token
 * @returns The generated CSRF token
 */
export function generateCsrfToken(): string {
  const tokenBytes = crypto.randomBytes(32);
  return tokenBytes.toString('hex');
}

/**
 * Generate a CSRF token and set it in a cookie
 */
export async function setCsrfToken(): Promise<string> {
  const token = generateCsrfToken();
  
  // Set the CSRF token in a cookie
  cookies().set({
    name: CSRF_TOKEN_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: CSRF_TOKEN_EXPIRY,
  });
  
  return token;
}

/**
 * Retrieve the CSRF token from cookies
 */
export function getCsrfToken(): string | undefined {
  const cookieStore = cookies();
  const csrfCookie = cookieStore.get(CSRF_TOKEN_COOKIE);
  return csrfCookie?.value;
}

/**
 * Get or create a CSRF token
 */
export async function getOrCreateCsrfToken(): Promise<string> {
  const existingToken = getCsrfToken();
  if (existingToken) {
    return existingToken;
  }
  
  return await setCsrfToken();
}

/**
 * Clear the CSRF token cookie
 */
export function clearCsrfToken(): void {
  cookies().set({
    name: CSRF_TOKEN_COOKIE,
    value: '',
    expires: new Date(0),
    path: '/',
  });
}

/**
 * Validate a CSRF token from a request
 */
export async function validateCsrfToken(request: Request): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the expected token from the cookie
    const expectedToken = getCsrfToken();
    if (!expectedToken) {
      return { success: false, error: 'No CSRF token found in cookies' };
    }
    
    // Get the actual token from the request
    let actualToken: string | null = null;
    
    // Try to get from headers first
    actualToken = request.headers.get(CSRF_TOKEN_HEADER);
    
    // If not in headers, check if it's a form submission
    if (!actualToken) {
      const contentType = request.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        // For JSON requests
        try {
          const clonedRequest = request.clone();
          const body = await clonedRequest.json();
          actualToken = body[CSRF_TOKEN_FORM_FIELD] || null;
        } catch (error) {
          return { success: false, error: 'Failed to parse JSON body' };
        }
      } else if (contentType?.includes('application/x-www-form-urlencoded')) {
        // For form submissions
        try {
          const clonedRequest = request.clone();
          const formData = await clonedRequest.formData();
          actualToken = formData.get(CSRF_TOKEN_FORM_FIELD) as string || null;
        } catch (error) {
          return { success: false, error: 'Failed to parse form data' };
        }
      }
    }
    
    if (!actualToken) {
      return { success: false, error: 'CSRF token not provided in request' };
    }
    
    // Validate the token using a timing-safe comparison
    const tokensMatch = crypto.timingSafeEqual(
      Buffer.from(expectedToken),
      Buffer.from(actualToken)
    );
    
    if (!tokensMatch) {
      return { success: false, error: 'CSRF token validation failed' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('CSRF validation error:', error);
    return { success: false, error: 'CSRF validation error' };
  }
}

/**
 * Generate HTML for a hidden CSRF token input field
 */
export function csrfTokenField(): string {
  const token = getCsrfToken();
  if (!token) {
    throw new Error('CSRF token not set in cookies');
  }
  
  return `<input type="hidden" name="${CSRF_TOKEN_FORM_FIELD}" value="${token}">`;
}

/**
 * Create middleware for CSRF protection
 */
export function csrfMiddleware(request: NextRequest) {
  // Get the method
  const method = request.method;
  
  // Skip for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return NextResponse.next();
  }
  
  // For unsafe methods, validate CSRF token
  const cookieToken = getCsrfToken();
  const headerToken = request.headers.get(CSRF_TOKEN_HEADER);
  
  if (!cookieToken || !headerToken) {
    return new NextResponse(
      JSON.stringify({ error: 'CSRF token missing' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // Compare tokens using timing-safe comparison
  try {
    const tokensMatch = crypto.timingSafeEqual(
      Buffer.from(cookieToken),
      Buffer.from(headerToken)
    );
    
    if (!tokensMatch) {
      return new NextResponse(
        JSON.stringify({ error: 'CSRF token validation failed' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ error: 'CSRF validation error' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // Token is valid, proceed
  const response = NextResponse.next();
  
  // Rotate token after successful mutation
  const newToken = generateCsrfToken();
  cookies().set({
    name: CSRF_TOKEN_COOKIE,
    value: newToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: CSRF_TOKEN_EXPIRY,
  });
  
  // Add the new token to the response header for client-side refresh
  response.headers.set(CSRF_TOKEN_HEADER, newToken);
  
  return response;
}