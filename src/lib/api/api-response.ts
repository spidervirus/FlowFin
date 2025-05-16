/**
 * API Response Utilities
 * 
 * This file provides standardized API response formats and helpers for
 * consistent error handling across all API endpoints.
 */

import { NextResponse } from 'next/server';

// Standard response types
export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
  metadata?: {
    page?: number;
    pageSize?: number;
    totalCount?: number;
    totalPages?: number;
    [key: string]: any;
  };
};

export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  correlationId?: string;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Error codes
export enum ApiErrorCode {
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

// HTTP status code mapping
const errorStatusMap: Record<ApiErrorCode, number> = {
  [ApiErrorCode.BAD_REQUEST]: 400,
  [ApiErrorCode.UNAUTHORIZED]: 401,
  [ApiErrorCode.FORBIDDEN]: 403,
  [ApiErrorCode.NOT_FOUND]: 404,
  [ApiErrorCode.CONFLICT]: 409,
  [ApiErrorCode.VALIDATION_ERROR]: 422,
  [ApiErrorCode.RATE_LIMIT]: 429,
  [ApiErrorCode.INTERNAL_ERROR]: 500,
  [ApiErrorCode.SERVICE_UNAVAILABLE]: 503,
};

// Success response helper
export function apiSuccess<T>(
  data: T, 
  metadata?: ApiSuccessResponse<T>['metadata'],
  statusCode: number = 200
): NextResponse {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data
  };
  
  if (metadata) {
    response.metadata = metadata;
  }
  
  return NextResponse.json(response, { status: statusCode });
}

// Error response helper
export function apiError(
  code: ApiErrorCode | string,
  message: string,
  details?: any,
  statusCodeOverride?: number
): NextResponse {
  // Generate correlation ID for tracing this error through logs
  const correlationId = crypto.randomUUID();
  
  // Determine status code - use override or mapped code or default to 500
  const errorCode = code as ApiErrorCode;
  const statusCode = statusCodeOverride || 
    (errorCode in errorStatusMap ? errorStatusMap[errorCode] : 500);
  
  // Construct error response
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message
    },
    correlationId
  };
  
  if (details) {
    response.error.details = details;
  }
  
  // Log the error for server-side debugging
  console.error(`API Error [${correlationId}]:`, {
    code,
    message,
    details,
    statusCode
  });
  
  return NextResponse.json(response, { status: statusCode });
}

// Validation error helper
export function apiValidationError(
  details: Record<string, string[]> | string[] | string,
  message: string = 'Validation error'
): NextResponse {
  return apiError(
    ApiErrorCode.VALIDATION_ERROR,
    message,
    typeof details === 'string' ? { message: details } : 
    Array.isArray(details) ? { errors: details } : 
    { fields: details },
    422
  );
}

// Not found error helper
export function apiNotFound(
  resourceType: string,
  identifier?: string | number
): NextResponse {
  const message = identifier 
    ? `${resourceType} with identifier ${identifier} not found`
    : `${resourceType} not found`;
    
  return apiError(ApiErrorCode.NOT_FOUND, message, null, 404);
}

// Unauthorized error helper
export function apiUnauthorized(
  message: string = 'Authentication required'
): NextResponse {
  return apiError(ApiErrorCode.UNAUTHORIZED, message, null, 401);
}

// Forbidden error helper
export function apiForbidden(
  message: string = 'You do not have permission to access this resource'
): NextResponse {
  return apiError(ApiErrorCode.FORBIDDEN, message, null, 403);
}

// General API exception handler
export async function withErrorHandling<T>(
  handler: () => Promise<T>,
  errorMap?: Record<string, { code: ApiErrorCode; statusCode?: number }>
): Promise<NextResponse> {
  try {
    const result = await handler();
    return apiSuccess(result);
  } catch (error: any) {
    // Check if we have a specific error mapping for this error
    if (errorMap && error.name && errorMap[error.name]) {
      const { code, statusCode } = errorMap[error.name];
      return apiError(code, error.message, null, statusCode);
    }
    
    // Default error handling
    console.error('API Error:', error);
    
    // Handle common error types
    if (error.name === 'ValidationError') {
      return apiValidationError(error.details || error.message);
    }
    
    if (error.name === 'NotFoundError') {
      return apiNotFound(error.resource || 'Resource', error.identifier);
    }
    
    if (error.name === 'AuthenticationError') {
      return apiUnauthorized(error.message);
    }
    
    if (error.name === 'AuthorizationError') {
      return apiForbidden(error.message);
    }
    
    // Generic error response
    return apiError(
      ApiErrorCode.INTERNAL_ERROR,
      'An unexpected error occurred',
      process.env.NODE_ENV === 'development' ? error : undefined
    );
  }
}

// Exported types for API implementations
export interface ApiRequest<T> {
  body: T;
  userId?: string;
  query?: Record<string, string | string[]>;
}

export interface ApiContext {
  userId?: string;
  isAuthenticated: boolean;
  [key: string]: any;
}