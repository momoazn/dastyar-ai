import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { logger } from "@/lib/logger";

type RateLimitConfig = {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum number of requests per window
  message?: string; // Custom error message
  keyPrefix?: string; // Prefix for the store key (for separation)
};

type RequestRecord = {
  count: number;
  resetTime: number;
  windowStart: number;
};

// In-memory store for rate limiting
// Note: This is simple but won't work across multiple instances
// For production with multiple instances, use Redis or similar
const store = new Map<string, RequestRecord>();

// Separate store for user-specific rate limiting
const userStore = new Map<string, RequestRecord>();

// Cleanup old entries every minute
setInterval(() => {
  const now = Date.now();

  // Clean up IP-based store
  for (const [key, record] of store.entries()) {
    if (now > record.resetTime) {
      store.delete(key);
    }
  }

  // Clean up user-based store
  for (const [key, record] of userStore.entries()) {
    if (now > record.resetTime) {
      userStore.delete(key);
    }
  }
}, 60_000);

/**
 * IP-based rate limiter
 * Limits requests per IP address
 */
export const rateLimiter = (config: RateLimitConfig): MiddlewareHandler => {
  const {
    windowMs,
    maxRequests,
    message = "Too many requests, please try again later.",
    keyPrefix = "ip",
  } = config;

  return async (c, next) => {
    // Use IP address as identifier
    const ip =
      c.req.header("x-forwarded-for") ||
      c.req.header("x-real-ip") ||
      c.req.header("cf-connecting-ip") ||
      "unknown";
    const identifier = `${keyPrefix}:${ip}`;

    const now = Date.now();
    const record = store.get(identifier);

    if (!record || now > record.resetTime) {
      // First request or window expired, create new record
      store.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
        windowStart: now,
      });
      return next();
    }

    if (record.count >= maxRequests) {
      // Rate limit exceeded
      const resetInSeconds = Math.ceil((record.resetTime - now) / 1000);
      logger.warn("IP rate limit exceeded", {
        ip,
        count: record.count,
        limit: maxRequests,
        resetIn: resetInSeconds,
      });

      // Add rate limit headers
      c.header("X-RateLimit-Limit", maxRequests.toString());
      c.header("X-RateLimit-Remaining", "0");
      c.header("X-RateLimit-Reset", record.resetTime.toString());
      c.header("Retry-After", resetInSeconds.toString());

      throw new HTTPException(429, {
        message: `${message} Try again in ${resetInSeconds} seconds.`,
      });
    }

    // Increment count
    record.count++;

    // Add rate limit info headers
    c.header("X-RateLimit-Limit", maxRequests.toString());
    c.header(
      "X-RateLimit-Remaining",
      (maxRequests - record.count).toString()
    );
    c.header("X-RateLimit-Reset", record.resetTime.toString());

    return next();
  };
};

/**
 * User-specific rate limiter
 * Limits requests per authenticated user
 * Requires authentication context (c.get('user'))
 */
export const userRateLimiter = (
  config: RateLimitConfig
): MiddlewareHandler => {
  const {
    windowMs,
    maxRequests,
    message = "You have exceeded your request quota. Please try again later.",
  } = config;

  return async (c, next) => {
    // Get user from context (set by authentication middleware)
    const user = c.get("user");

    if (!user || !user.id) {
      // No user context - skip user rate limiting
      // IP-based rate limiting should still apply
      return next();
    }

    const identifier = `user:${user.id}`;
    const now = Date.now();
    const record = userStore.get(identifier);

    if (!record || now > record.resetTime) {
      // First request or window expired, create new record
      userStore.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
        windowStart: now,
      });
      return next();
    }

    if (record.count >= maxRequests) {
      // Rate limit exceeded
      const resetInSeconds = Math.ceil((record.resetTime - now) / 1000);
      const resetTime = new Date(record.resetTime).toISOString();

      logger.warn("User rate limit exceeded", {
        userId: user.id,
        username: user.username,
        count: record.count,
        limit: maxRequests,
        resetIn: resetInSeconds,
        resetTime,
      });

      // Add rate limit headers
      c.header("X-RateLimit-User-Limit", maxRequests.toString());
      c.header("X-RateLimit-User-Remaining", "0");
      c.header("X-RateLimit-User-Reset", record.resetTime.toString());
      c.header("Retry-After", resetInSeconds.toString());

      throw new HTTPException(429, {
        message: `${message} Your quota resets in ${resetInSeconds} seconds (${resetTime}).`,
      });
    }

    // Increment count
    record.count++;

    // Add rate limit info headers
    c.header("X-RateLimit-User-Limit", maxRequests.toString());
    c.header(
      "X-RateLimit-User-Remaining",
      (maxRequests - record.count).toString()
    );
    c.header("X-RateLimit-User-Reset", record.resetTime.toString());

    return next();
  };
};

/**
 * Get current rate limit status for an identifier
 * Useful for monitoring and debugging
 */
export const getRateLimitStatus = (
  identifier: string
): RequestRecord | null => {
  return (
    store.get(identifier) || userStore.get(`user:${identifier}`) || null
  );
};

/**
 * Reset rate limit for a specific identifier
 * Useful for admin operations
 */
export const resetRateLimit = (identifier: string): boolean => {
  const deleted =
    store.delete(identifier) || userStore.delete(`user:${identifier}`);
  if (deleted) {
    logger.info("Rate limit reset", { identifier });
  }
  return deleted;
};

/**
 * Get rate limit statistics
 * Useful for monitoring
 */
export const getRateLimitStats = (): {
  ipLimitedCount: number;
  userLimitedCount: number;
  totalTracked: number;
} => {
  return {
    ipLimitedCount: store.size,
    userLimitedCount: userStore.size,
    totalTracked: store.size + userStore.size,
  };
};
