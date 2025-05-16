import { NextRequest, NextResponse } from "next/server";
import { logger } from "./logger";

interface RateLimitConfig {
  maxRequests: number; // Maximum requests per window
  windowMs: number; // Time window in milliseconds
}

class MemoryStore {
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

// TODO: Implement Redis store for production
class RedisStore {
  // Implement Redis-based rate limiting for production
}

export class RateLimit {
  private store: MemoryStore;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.store = new MemoryStore();
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

    return `${ip}:${route}`;
  }

  async check(request: NextRequest): Promise<NextResponse | null> {
    try {
      const key = this.getKey(request);
      const requestCount = await this.store.increment(
        key,
        this.config.windowMs,
      );

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
        });

        return NextResponse.json(
          {
            error: {
              message: "Too many requests",
              code: "RATE_LIMIT_EXCEEDED",
            },
          },
          {
            status: 429,
            headers,
          },
        );
      }

      return null;
    } catch (error) {
      logger.error(
        "Rate limit error",
        error instanceof Error ? error : new Error("Unknown error"),
      );
      return null; // Allow request through on error
    }
  }
}

// Create default rate limiter instances
export const defaultRateLimit = new RateLimit({
  maxRequests: 100, // 100 requests
  windowMs: 60000, // per minute
});

interface StrictRateLimitEntry {
  count: number;
  timestamp: number;
}

const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds
const MAX_REQUESTS = 50; // Maximum requests per window for strict limiting

const rateLimitStore = new Map<string, StrictRateLimitEntry>();

export const strictRateLimit = {
  check: async (request: NextRequest) => {
    try {
      const ip =
        request.headers.get("x-forwarded-for") || request.ip || "unknown";
      const now = Date.now();

      // Clean up old entries
      for (const [key, entry] of rateLimitStore.entries()) {
        if (now - entry.timestamp > RATE_LIMIT_WINDOW) {
          rateLimitStore.delete(key);
        }
      }

      // Get or create rate limit entry
      const entry = rateLimitStore.get(ip) || { count: 0, timestamp: now };

      // Reset count if window has passed
      if (now - entry.timestamp > RATE_LIMIT_WINDOW) {
        entry.count = 0;
        entry.timestamp = now;
      }

      // Increment request count
      entry.count++;
      rateLimitStore.set(ip, entry);

      // Check if rate limit exceeded
      if (entry.count > MAX_REQUESTS) {
        logger.warn("Rate limit exceeded", { ip, count: entry.count });
        return NextResponse.json(
          { error: "Too many requests" },
          { status: 429 },
        );
      }

      return null;
    } catch (error) {
      logger.error(
        "Error in rate limit check",
        error instanceof Error ? error : new Error(String(error)),
      );
      return null; // Fail open on error
    }
  },
};
