import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Standard API response format
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: string | null;
  statusCode: number;
}

/**
 * Create a standardized API response
 * @param data The data to return
 * @param error Error message, if any
 * @param status HTTP status code
 * @param headers Additional headers to include
 * @returns A NextResponse with standardized format
 */
export function createApiResponse<T = any>(
  data: T | null = null,
  error: string | null = null,
  status: number = 200,
  headers: Record<string, string> = {}
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: !error && status >= 200 && status < 300,
    data,
    error,
    statusCode: status,
  };

  const nextResponse = NextResponse.json(response, { status });
  
  // Add custom headers
  Object.entries(headers).forEach(([key, value]) => {
    nextResponse.headers.set(key, value);
  });
  
  // Add security headers to API responses
  nextResponse.headers.set('X-Content-Type-Options', 'nosniff');
  nextResponse.headers.set('X-Frame-Options', 'DENY');
  nextResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  nextResponse.headers.set('Pragma', 'no-cache');
  
  return nextResponse;
}

/**
 * Create a success response
 * @param data The data to return
 * @param status HTTP status code (default: 200)
 * @param headers Additional headers to include
 * @returns A NextResponse with standardized format
 */
export function createSuccessResponse<T = any>(
  data: T,
  status: number = 200,
  headers: Record<string, string> = {}
): NextResponse<ApiResponse<T>> {
  return createApiResponse(data, null, status, headers);
}

/**
 * Create an error response
 * @param error Error message
 * @param status HTTP status code (default: 400)
 * @param headers Additional headers to include
 * @returns A NextResponse with standardized format
 */
export function createErrorResponse(
  error: string,
  status: number = 400,
  headers: Record<string, string> = {}
): NextResponse<ApiResponse<null>> {
  return createApiResponse(null, error, status, headers);
}

/**
 * Create a response with a Set-Cookie header
 * @param data The data to return
 * @param cookieName Cookie name
 * @param cookieValue Cookie value
 * @param options Cookie options
 * @param status HTTP status code
 * @returns A NextResponse with standardized format and Set-Cookie header
 */
export function createResponseWithCookie<T = any>(
  data: T | null,
  cookieName: string,
  cookieValue: string,
  options: {
    maxAge?: number;
    expires?: Date;
    path?: string;
    domain?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
  } = {},
  status: number = 200
): NextResponse<ApiResponse<T>> {
  // Set cookie with the provided options
  cookies().set({
    name: cookieName,
    value: cookieValue,
    ...options,
  });
  
  // Create and return the API response
  return createApiResponse(data, null, status);
}

/**
 * Create a not found response
 * @param message Custom not found message (optional)
 * @returns A NextResponse with standardized format and 404 status code
 */
export function createNotFoundResponse(message?: string): NextResponse<ApiResponse<null>> {
  return createApiResponse(null, message || 'Not found', 404);
}

/**
 * Create an unauthorized response
 * @param message Custom unauthorized message (optional)
 * @returns A NextResponse with standardized format and 401 status code
 */
export function createUnauthorizedResponse(message?: string): NextResponse<ApiResponse<null>> {
  return createApiResponse(null, message || 'Unauthorized', 401);
}

/**
 * Create a forbidden response
 * @param message Custom forbidden message (optional)
 * @returns A NextResponse with standardized format and 403 status code
 */
export function createForbiddenResponse(message?: string): NextResponse<ApiResponse<null>> {
  return createApiResponse(null, message || 'Forbidden', 403);
}

/**
 * Create a validation error response
 * @param errors Validation errors object
 * @returns A NextResponse with standardized format and 422 status code
 */
export function createValidationErrorResponse(errors: Record<string, string>): NextResponse<ApiResponse<null>> {
  return createApiResponse(null, 'Validation failed', 422, {
    'X-Validation-Errors': JSON.stringify(errors),
  });
}