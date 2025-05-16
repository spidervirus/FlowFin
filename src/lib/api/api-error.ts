/**
 * API Error Classes
 * 
 * This file provides standardized error classes for API error handling.
 * These error classes can be thrown in business logic and caught at the API layer.
 */

import { ApiErrorCode } from './api-response';

/**
 * Base API Error class that all specific API errors extend
 */
export class ApiError extends Error {
  code: ApiErrorCode | string;
  statusCode: number;
  details?: any;
  correlationId?: string;

  constructor(
    message: string,
    code: ApiErrorCode | string = ApiErrorCode.INTERNAL_ERROR,
    statusCode: number = 500,
    details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.correlationId = crypto.randomUUID();
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * Serializes the error for API responses
   */
  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
      correlationId: this.correlationId,
    };
  }
}

/**
 * Validation Error - Used for invalid input data (400 Bad Request)
 */
export class ValidationError extends ApiError {
  constructor(message: string = 'Validation error', details?: any) {
    super(
      message,
      ApiErrorCode.VALIDATION_ERROR,
      400,
      details
    );
  }

  static fromFields(fieldErrors: Record<string, string[]>): ValidationError {
    return new ValidationError('Validation error', { fields: fieldErrors });
  }

  static fromMessages(messages: string[]): ValidationError {
    return new ValidationError('Validation error', { messages });
  }
}

/**
 * Not Found Error - Used when a requested resource doesn't exist (404 Not Found)
 */
export class NotFoundError extends ApiError {
  resource: string;
  identifier?: string | number;

  constructor(resource: string, identifier?: string | number) {
    const message = identifier 
      ? `${resource} with identifier ${identifier} not found`
      : `${resource} not found`;
    
    super(
      message,
      ApiErrorCode.NOT_FOUND,
      404
    );
    
    this.resource = resource;
    this.identifier = identifier;
  }
}

/**
 * Authentication Error - Used when user is not authenticated (401 Unauthorized)
 */
export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(
      message,
      ApiErrorCode.UNAUTHORIZED,
      401
    );
  }
}

/**
 * Authorization Error - Used when user doesn't have permission (403 Forbidden)
 */
export class AuthorizationError extends ApiError {
  constructor(message: string = 'You do not have permission to access this resource') {
    super(
      message,
      ApiErrorCode.FORBIDDEN,
      403
    );
  }
}

/**
 * Conflict Error - Used for resource conflicts (409 Conflict)
 */
export class ConflictError extends ApiError {
  constructor(message: string, details?: any) {
    super(
      message,
      ApiErrorCode.CONFLICT,
      409,
      details
    );
  }
}

/**
 * Rate Limit Error - Used when request rate limit is exceeded (429 Too Many Requests)
 */
export class RateLimitError extends ApiError {
  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(
      message,
      ApiErrorCode.RATE_LIMIT,
      429,
      retryAfter ? { retryAfter } : undefined
    );
  }
}

/**
 * Service Unavailable Error - Used when a service is temporarily unavailable (503 Service Unavailable)
 */
export class ServiceUnavailableError extends ApiError {
  constructor(message: string = 'Service temporarily unavailable') {
    super(
      message,
      ApiErrorCode.SERVICE_UNAVAILABLE,
      503
    );
  }
}

/**
 * Database Error - Used for database-related errors
 */
export class DatabaseError extends ApiError {
  constructor(message: string, details?: any) {
    super(
      message,
      'DATABASE_ERROR',
      500,
      details
    );
  }
}

/**
 * External Service Error - Used for errors from external services or APIs
 */
export class ExternalServiceError extends ApiError {
  service: string;
  
  constructor(service: string, message: string, details?: any) {
    super(
      `Error from external service (${service}): ${message}`,
      'EXTERNAL_SERVICE_ERROR',
      502,
      details
    );
    
    this.service = service;
  }
}