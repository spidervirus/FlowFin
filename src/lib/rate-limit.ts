import { NextRequest, NextResponse } from "next/server";
import { logger } from "./logger";
import { Redis } from "@upstash/redis";

interface RateLimitConfig {
  maxRequests: number; // Maximum requests per window
  windowMs: number; // Time window in milliseconds
  keyPrefix?: string; // Prefix for Redis keys
  onRateLimit?: (key: string) => void; // Optional callback for rate limit exceeded
}

interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<number>;
  reset(key: string): Promise<void>;
}

class MemoryStore implements RateLimitStore {
  private store: Map<string, { count: number; resetTime: number }>;

  constructor() {
    this.store = new Map();
  }

  async increment(key: string, windowMs: number): Promise<number> {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || now > record.resetTime) {
      this.store.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return 1;
    }

    record.count += 1;
    return record.count;
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }
}

class RedisStore implements RateLimitStore {
  private redis: Redis;
  private keyPrefix: string;
  private isConnected: boolean = false;

  constructor(redis: Redis, keyPrefix: string = "rate_limit:") {
    this.redis = redis;
    this.keyPrefix = keyPrefix;
    this.checkConnection();
  }

  private async checkConnection(): Promise<void> {
    try {
      await this.redis.ping();
      this.isConnected = true;
    } catch (error) {
      this.isConnected = false;
      logger.error(
        "Redis connection error",
        error instanceof Error ? error : new Error("Unknown Redis error"),
      );
    }
  }

  async increment(key: string, windowMs: number): Promise<number> {
    if (!this.isConnected) {
      await this.checkConnection();
    }

    const fullKey = `${this.keyPrefix}${key}`;
    const now = Date.now();

    try {
      // Use Redis transaction to ensure atomicity
      const multi = this.redis.multi();

      // Add current request with proper type for score member
      multi.zadd(fullKey, { score: now, member: `${now}-${Math.random()}` });

      // Remove old requests
      multi.zremrangebyscore(fullKey, 0, now - windowMs);

      // Count remaining requests
      multi.zcard(fullKey);

      // Set expiry on the key
      multi.expire(fullKey, Math.ceil(windowMs / 1000));

      const results = await multi.exec();

      if (!results || results.length < 3) {
        throw new Error("Redis transaction failed");
      }

      return results[2] as number;
    } catch (error) {
      logger.error(
        "Redis increment error",
        error instanceof Error ? error : new Error("Unknown Redis error"),
      );
      // Fallback to memory store if Redis fails
      const memoryStore = new MemoryStore();
      return memoryStore.increment(key, windowMs);
    }
  }

  async reset(key: string): Promise<void> {
    if (!this.isConnected) {
      await this.checkConnection();
    }

    const fullKey = `${this.keyPrefix}${key}`;
    try {
      await this.redis.del(fullKey);
    } catch (error) {
      logger.error(
        "Redis reset error",
        error instanceof Error ? error : new Error("Unknown Redis error"),
      );
      // Fallback to memory store if Redis fails
      const memoryStore = new MemoryStore();
      await memoryStore.reset(key);
    }
  }
}

export class RateLimit {
  private store: RateLimitStore;
  private config: RateLimitConfig;
  private fallbackStore: MemoryStore;

  constructor(config: RateLimitConfig) {
    // Use Redis in production, MemoryStore in development
    const redis = process.env.REDIS_URL
      ? new Redis({
          url: process.env.REDIS_URL,
          token: process.env.REDIS_TOKEN,
        })
      : null;

    this.fallbackStore = new MemoryStore();
    this.store = redis
      ? new RedisStore(redis, config.keyPrefix || "rate_limit:")
      : this.fallbackStore;

    this.config = config;
  }

  private getKey(request: NextRequest): string {
    // Get client IP address
    const ip =
      request.ip ||
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Get route identifier
    const route = new URL(request.url).pathname;

    // Get user ID if authenticated
    const userId = request.headers.get("x-user-id") || "anonymous";

    return `${ip}:${route}:${userId}`;
  }

  async check(request: NextRequest): Promise<NextResponse | null> {
    try {
      const key = this.getKey(request);
      let requestCount: number;

      try {
        requestCount = await this.store.increment(key, this.config.windowMs);
      } catch (error) {
        logger.error(
          "Primary store error, falling back to memory store",
          error instanceof Error ? error : new Error("Unknown error"),
        );
        requestCount = await this.fallbackStore.increment(
          key,
          this.config.windowMs,
        );
      }

      // Add rate limit headers
      const headers = new Headers();
      headers.set("X-RateLimit-Limit", this.config.maxRequests.toString());
      headers.set(
        "X-RateLimit-Remaining",
        Math.max(0, this.config.maxRequests - requestCount).toString(),
      );
      headers.set(
        "X-RateLimit-Reset",
        (Date.now() + this.config.windowMs).toString(),
      );

      if (requestCount > this.config.maxRequests) {
        logger.warn("Rate limit exceeded", {
          key,
          requestCount,
          limit: this.config.maxRequests,
          ip: request.ip,
          route: new URL(request.url).pathname,
        });

        return NextResponse.json(
          {
            error: {
              message: "Too many requests",
              code: "RATE_LIMIT_EXCEEDED",
              retryAfter: Math.ceil(this.config.windowMs / 1000),
            },
          },
          {
            status: 429,
            headers: {
              ...Object.fromEntries(headers),
              "Retry-After": Math.ceil(this.config.windowMs / 1000).toString(),
            },
          },
        );
      }

      return null;
    } catch (error) {
      logger.error(
        "Rate limit error",
        error instanceof Error ? error : new Error("Unknown error"),
      );
      // On error, allow the request through but log the error
      return null;
    }
  }

  async reset(key: string): Promise<void> {
    try {
      await this.store.reset(key);
    } catch (error) {
      logger.error(
        "Primary store reset error, falling back to memory store",
        error instanceof Error ? error : new Error("Unknown error"),
      );
      await this.fallbackStore.reset(key);
    }
  }
}

// Create default rate limiter instances with different configurations
export const defaultRateLimit = new RateLimit({
  maxRequests: 100, // 100 requests
  windowMs: 60000, // per minute
  keyPrefix: "rate_limit:default:",
});

export const strictRateLimit = new RateLimit({
  maxRequests: 50, // 50 requests
  windowMs: 60000, // per minute
  keyPrefix: "rate_limit:strict:",
});

export const apiRateLimit = new RateLimit({
  maxRequests: 1000, // 1000 requests
  windowMs: 3600000, // per hour
  keyPrefix: "rate_limit:api:",
});

export const authRateLimit = new RateLimit({
  maxRequests: 5, // 5 attempts
  windowMs: 300000, // per 5 minutes
  keyPrefix: "rate_limit:auth:",
  onRateLimit: (key: string) => {
    logger.warn("Auth rate limit exceeded", { key });
    // Implement additional security measures like temporary IP blocking
  },
});

// Middleware function to apply rate limiting
export async function rateLimitMiddleware(
  request: NextRequest,
  config: RateLimitConfig = { maxRequests: 100, windowMs: 60000 },
): Promise<NextResponse | null> {
  const limiter = new RateLimit(config);
  return limiter.check(request);
}
