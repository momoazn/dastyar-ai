import { join } from "node:path";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger as honoLogger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { env, rateLimitConfig, webDistDir } from "./config";
import { logger } from "./lib/logger";
import { rateLimiter, userRateLimiter } from "./middlewares/rate-limiter";
import chatHandler from "./routes/chat";
import imagesHandler from "./routes/images";
import orpcHandler from "./routes/rpc";

// Regex patterns moved to top level for performance
const TRAILING_SLASH_REGEX = /\/$/;

export function createApp() {
  const app = new Hono();

  // Logger middleware
  app.use(honoLogger());

  // Security headers middleware
  app.use(
    "*",
    secureHeaders({
      contentSecurityPolicy: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
      crossOriginOpenerPolicy: false, // Disable COOP for non-HTTPS origins (allows network access)
      xFrameOptions: "DENY",
      xContentTypeOptions: "nosniff",
      referrerPolicy: "strict-origin-when-cross-origin",
      strictTransportSecurity: "max-age=31536000; includeSubDomains",
    })
  );

  // CORS middleware
  app.use(
    "/*",
    cors({
      origin: env.CORS_ORIGIN,
      allowMethods: ["GET", "POST", "OPTIONS"],
    })
  );

  // Global IP-based rate limiting for all API routes
  // This applies to all users, authenticated or not
  if (rateLimitConfig.enabled) {
    app.use(
      "/api/*",
      rateLimiter({
        windowMs: rateLimitConfig.ip.windowMs,
        maxRequests: rateLimitConfig.ip.maxRequests,
      })
    );
    app.use(
      "/rpc/*",
      rateLimiter({
        windowMs: rateLimitConfig.ip.windowMs,
        maxRequests: rateLimitConfig.ip.maxRequests,
      })
    );
  }

  // User-specific rate limiting for RPC routes
  // This applies only to authenticated users (has user context)
  // Limits are more generous than IP limits but tracked per user
  if (rateLimitConfig.enabled) {
    app.use(
      "/rpc/*",
      userRateLimiter({
        windowMs: rateLimitConfig.user.windowMs,
        maxRequests: rateLimitConfig.user.maxRequests,
        message: "You have exceeded your request quota",
      })
    );
  }

  // User-specific rate limiting for streaming API routes
  if (rateLimitConfig.enabled) {
    app.use(
      "/api/chat/*",
      userRateLimiter({
        windowMs: rateLimitConfig.chat.windowMs,
        maxRequests: rateLimitConfig.chat.maxRequests,
        message: "You have exceeded your chat request quota",
      })
    );
    app.use(
      "/api/images/*",
      userRateLimiter({
        windowMs: rateLimitConfig.images.windowMs,
        maxRequests: rateLimitConfig.images.maxRequests,
        message: "You have exceeded your image generation quota",
      })
    );
  }

  // API routes
  app.route("/rpc", orpcHandler);
  app.route("/api/chat", chatHandler);
  app.route("/api/images", imagesHandler);

  // Health endpoints
  // if (!isProduction()) {
  //   app.get("/", (c) => c.text("Server is running", 200));
  // }
  app.get("/health", async (c) => {
    const base =
      env.WHISPER_SERVER_URL?.replace(TRAILING_SLASH_REGEX, "") || "";
    let whisper = { available: false, status: 0 };
    if (base) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(
          () => controller.abort(),
          env.WHISPER_TIMEOUT_MS
        );
        const res = await fetch(`${base}/health`, {
          signal: controller.signal,
        });
        clearTimeout(timer);
        whisper = { available: res.ok, status: res.status };
      } catch {
        whisper = { available: false, status: 0 };
      }
    }
    return c.json({ status: "ok", whisper });
  });

  const spaIndexPath = join(webDistDir, "index.html");
  app.use(
    "/*",
    serveStatic({
      root: webDistDir,
    })
  );

  // Global error handler
  app.onError((err, c) => {
    // Log the error for observability
    logger.error("Request error", err, {
      path: c.req.path,
      method: c.req.method,
    });
    const status = err instanceof HTTPException ? err.status : 500;
    const message =
      err instanceof HTTPException ? err.message : "Internal Server Error";
    return c.json({ error: message }, status);
  });

  // 404 handler
  app.notFound((c) => {
    const isGet = c.req.method === "GET";
    const path = c.req.path;
    if (isGet && !path.startsWith("/api") && !path.startsWith("/rpc")) {
      const indexFile = Bun.file(spaIndexPath);
      return c.newResponse(indexFile.stream(), 200, {
        "Content-Type": "text/html; charset=utf-8",
      });
    }
    return c.json({ error: "Not Found" }, 404);
  });

  return app;
}
