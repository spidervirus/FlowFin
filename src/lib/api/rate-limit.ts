/**
 * API Rate Limiting Utilities
 * 
 * This file provides rate limiting capabilities for API routes to protect
 * against abuse and ensure fair usage of resources.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiError, ApiErrorCode } from './api-response';

// In-memory store for rate limiting (will reset on server restart)
// For production, consider using Redis or another persistent store
const requestStore: Record<string, { count: number; resetTime: number }> = {};

// Default rate limit settings
const DEFAULT_RATE_LIMIT = {
  max: 100,           // maximum requests
  windowMs: 60 * 1000, // time window in milliseconds (1 minute)
  identifier: 'ip',   // how to identify clients
};

export type RateLimitOptions = {
  // Maximum number of requests allowed in the time window
  max?: number;
  
  // Time window in milliseconds
  windowMs?: number;
  
  // Function to get a unique identifier for the request
  // Defaults to IP address
  identifierFn?: (req: NextRequest) => string;
  
  // Custom response when rate limit exceeded
  handler?: (req: NextRequest, limit: RateLimitInfo) => NextResponse;
};

export type RateLimitInfo = {
  limit: number;
  remaining: number;
  reset: Date;
  isRateLimited: boolean;
};

/**
 * Cleans up expired rate limit entries to prevent memory leaks
 * This should be called periodically in a production environment
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  
  Object.entries(requestStore).forEach(([key, data]) => {
    if (data.resetTime < now) {
      delete requestStore[key];
    }
  });
}

// Setup a cleanup interval (runs every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimits, 5 * 60 * 1000);
}

/**
 * Gets the client IP address from the request
 */
function getIpAddress(req: NextRequest): string {
  // Try to get the real IP from common headers
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for may contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }
  
  // Try other common headers
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // If all else fails, use connection info
  // This might be unavailable or inaccurate in some environments
  const ip = req.ip || '127.0.0.1';
  return ip;
}

/**
 * Get rate limit info for a request
 */
export function getRateLimitInfo(
  req: NextRequest, 
  options: RateLimitOptions = {}
): RateLimitInfo {
  const {
    max = DEFAULT_RATE_LIMIT.max,
    windowMs = DEFAULT_RATE_LIMIT.windowMs,
    identifierFn = (req) => getIpAddress(req),
  } = options;
  
  // Get unique identifier for this client
  const identifier = identifierFn(req);
  
  // Get current time
  const now = Date.now();
  
  // Initialize or get current store entry
  if (!requestStore[identifier] || requestStore[identifier].resetTime < now) {
    requestStore[identifier] = {
      count: 0,
      resetTime: now + windowMs,
    };
  }
  
  // Increment request count
  requestStore[identifier].count += 1;
  
  // Calculate remaining requests
  const remaining = Math.max(0, max - requestStore[identifier].count);
  const isRateLimited = requestStore[identifier].count > max;
  
  return {
    limit: max,
    remaining,
    reset: new Date(requestStore[identifier].resetTime),
    isRateLimited,
  };
}

/**
 * Apply rate limiting middleware to an API route
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse,
  options: RateLimitOptions = {}
) {
  return async (req: NextRequest) => {
    const {
      max = DEFAULT_RATE_LIMIT.max,
      windowMs = DEFAULT_RATE_LIMIT.windowMs,
      identifierFn = (req) => getIpAddress(req),
      handler: customHandler,
    } = options;
    
    // Get rate limit info
    const rateLimitInfo = getRateLimitInfo(req, { max, windowMs, identifierFn });
    
    // Set rate limit headers
    const response = rateLimitInfo.isRateLimited 
      ? (customHandler ? customHandler(req, rateLimitInfo) : createRateLimitResponse(rateLimitInfo))
      : await handler(req);
    
    // Add rate limit headers to the response
    response.headers.set('X-RateLimit-Limit', max.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitInfo.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitInfo.reset.getTime().toString());
    
    if (rateLimitInfo.isRateLimited) {
      response.headers.set('Retry-After', Math.ceil((rateLimitInfo.reset.getTime() - Date.now()) / 1000).toString());
    }
    
    return response;
  };
}

/**
 * Create a standardized rate limit exceeded response
 */
function createRateLimitResponse(rateLimitInfo: RateLimitInfo): NextResponse {
  const retryAfter = Math.ceil((rateLimitInfo.reset.getTime() - Date.now()) / 1000);
  
  return apiError(
    ApiErrorCode.RATE_LIMIT,
    'Rate limit exceeded. Please try again later.',
    {
      limit: rateLimitInfo.limit,
      reset: rateLimitInfo.reset.toISOString(),
      retryAfter: `${retryAfter} seconds`,
    },
    429
  );
}

/**
 * Helper to create rate limit configurations for different scenarios
 */
export const rateLimits = {
  // Strict rate limit for auth endpoints (20 requests per minute)
  auth: {
    max: 20,
    windowMs: 60 * 1000,
  },
  
  // Standard API rate limit (100 requests per minute)
  standard: {
    max: 100,
    windowMs: 60 * 1000,
  },
  
  // Relaxed rate limit for read-only operations (200 requests per minute)
  readonly: {
    max: 200,
    windowMs: 60 * 1000,
  },
  
  // Very restrictive rate limit for sensitive operations (5 requests per minute)
  sensitive: {
    max: 5,
    windowMs: 60 * 1000,
  },
};