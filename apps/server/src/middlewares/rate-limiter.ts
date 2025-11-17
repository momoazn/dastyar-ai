import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";

type RateLimitConfig = {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum number of requests per window
  message?: string; // Custom error message
};

type RequestRecord = {
  count: number;
  resetTime: number;
};

// In-memory store for rate limiting
// Note: This is simple but won't work across multiple instances
// For production with multiple instances, use Redis or similar
const store = new Map<string, RequestRecord>();

// Cleanup old entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (now > record.resetTime) {
      store.delete(key);
    }
  }
}, 60_000);

export const rateLimiter = (config: RateLimitConfig): MiddlewareHandler => {
  const {
    windowMs,
    maxRequests,
    message = "Too many requests, please try again later.",
  } = config;

  return async (c, next) => {
    // Use IP address as identifier
    // In production, you might want to use authenticated user ID instead
    const identifier = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";

    const now = Date.now();
    const record = store.get(identifier);

    if (!record || now > record.resetTime) {
      // First request or window expired, create new record
      store.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (record.count >= maxRequests) {
      // Rate limit exceeded
      throw new HTTPException(429, { message });
    }

    // Increment count
    record.count++;
    return next();
  };
};
