import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { NextRequest } from 'next/server';

// Initialize Redis connection
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

// Configuration for different rate limits
interface RateLimitConfig {
  requests: number;
  duration: number; // in seconds
  errorMessage: string;
}

// Define rate limit configurations for different endpoints
const rateLimitConfigs: Record<string, RateLimitConfig> = {
  default: {
    requests: 60,    // 60 requests
    duration: 60,    // per 60 seconds
    errorMessage: 'Too many requests, please try again later.',
  },
  auth: {
    requests: 10,    // 10 requests
    duration: 60,    // per 60 seconds
    errorMessage: 'Too many authentication attempts, please try again later.',
  },
  signup: {
    requests: 5,     // 5 requests
    duration: 3600,  // per hour
    errorMessage: 'Too many signup attempts, please try again later.',
  },
  api: {
    requests: 100,   // 100 requests
    duration: 60,    // per 60 seconds
    errorMessage: 'Rate limit exceeded for API requests.',
  },
};

// Create a Redis client if credentials are available
let redis: Redis | null = null;
if (redisUrl && redisToken) {
  redis = new Redis({
    url: redisUrl,
    token: redisToken,
  });
}

// Cache for in-memory rate limiting when Redis is not available
const inMemoryCache = new Map<string, { count: number; timestamp: number }>();

// Create rate limiters for different endpoints
const rateLimiters: Record<string, Ratelimit | null> = {};

// Initialize rate limiters for configured endpoints
if (redis) {
  Object.entries(rateLimitConfigs).forEach(([key, config]) => {
    rateLimiters[key] = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.requests, `${config.duration} s`),
      analytics: true,
    });
  });
}

/**
 * Get client IP address from request
 * Handles various proxy headers and falls back to remote address
 */
function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Get the first IP in case of multiple proxies
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Fallback to request's IP
  return request.ip || 'unknown';
}

/**
 * Get a unique identifier for rate limiting
 * Based on IP address, endpoint, and optional user ID
 */
function getRateLimitIdentifier(request: NextRequest, endpoint: string, userId?: string): string {
  const ip = getClientIp(request);
  const baseIdentifier = `ratelimit:${endpoint}:${ip}`;
  
  // Include user ID if available for more accurate limiting
  return userId ? `${baseIdentifier}:${userId}` : baseIdentifier;
}

/**
 * In-memory rate limiter function
 * Used as a fallback when Redis is not available
 */
async function inMemoryRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const now = Date.now();
  
  // Clean up expired entries
  for (const [key, data] of inMemoryCache.entries()) {
    if (now - data.timestamp > config.duration * 1000) {
      inMemoryCache.delete(key);
    }
  }
  
  // Get or create entry
  const entry = inMemoryCache.get(identifier) || { count: 0, timestamp: now };
  
  // Reset if duration has passed
  if (now - entry.timestamp > config.duration * 1000) {
    entry.count = 1;
    entry.timestamp = now;
  } else {
    entry.count += 1;
  }
  
  // Update cache
  inMemoryCache.set(identifier, entry);
  
  // Calculate reset time
  const reset = Math.ceil((entry.timestamp + config.duration * 1000) / 1000);
  
  // Check if limit is exceeded
  const success = entry.count <= config.requests;
  
  return {
    success,
    limit: config.requests,
    remaining: Math.max(0, config.requests - entry.count),
    reset,
  };
}

/**
 * Rate limiter class with methods for checking limits
 */
class RateLimiter {
  /**
   * Check if a request is within rate limits
   * @param request The Next.js request object
   * @param type The type of rate limit to apply (default, auth, etc.)
   * @param userId Optional user ID for more accurate limiting
   */
  async check(
    request: NextRequest,
    type: keyof typeof rateLimitConfigs = 'default',
    userId?: string
  ): Promise<{ success: boolean; limit: number; remaining: number; reset: number; message?: string }> {
    const config = rateLimitConfigs[type] || rateLimitConfigs.default;
    const identifier = getRateLimitIdentifier(request, type, userId);
    
    // Use appropriate rate limiter
    const rateLimiter = rateLimiters[type];
    
    try {
      let result;
      
      if (rateLimiter && redis) {
        // Use Upstash Redis rate limiter
        result = await rateLimiter.limit(identifier);
      } else {
        // Fall back to in-memory rate limiting
        result = await inMemoryRateLimit(identifier, config);
      }
      
      // Add headers to track rate limit usage
      const headers = {
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.reset),
      };
      
      if (!result.success) {
        return {
          ...result,
          message: config.errorMessage,
          headers: {
            ...headers,
            'Retry-After': String(result.reset - Math.floor(Date.now() / 1000)),
          },
        };
      }
      
      return { ...result, headers };
    } catch (error) {
      console.error('Rate limiting error:', error);
      
      // Always allow the request in case of rate limiting errors
      return {
        success: true,
        limit: config.requests,
        remaining: 1,
        reset: Math.floor(Date.now() / 1000) + config.duration,
      };
    }
  }
  
  /**
   * Get rate limit configuration for a specific endpoint
   */
  getConfig(type: keyof typeof rateLimitConfigs = 'default'): RateLimitConfig {
    return rateLimitConfigs[type] || rateLimitConfigs.default;
  }
}

// Export a singleton instance
export const rateLimiter = new RateLimiter();

// Also export the class for custom instances
export { RateLimiter };