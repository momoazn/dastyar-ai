import { join } from "node:path";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger as honoLogger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { env, webDistDir } from "./config";
import { logger } from "./lib/logger";
import { rateLimiter } from "./middlewares/rate-limiter";
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
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
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

  // Rate limiting for API routes
  app.use(
    "/api/*",
    rateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100, // Limit each IP to 100 requests per window
    })
  );
  app.use(
    "/rpc/*",
    rateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100, // Limit each IP to 100 requests per window
    })
  );

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
  app.notFound((c) => c.json({ error: "Not Found" }, 404));
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
