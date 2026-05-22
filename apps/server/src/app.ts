import { join } from "node:path";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger as honoLogger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { env, webDistDir } from "./config";
import { logger } from "./lib/logger";
import chatHandler from "./routes/chat";
import imagesHandler from "./routes/images";
import orpcHandler from "./routes/rpc";

// Regex patterns moved to top level for performance
const TRAILING_SLASH_REGEX = /\/$/;
const WHISPER_HEALTH_TIMEOUT_MS = 3000;

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
          Math.min(env.WHISPER_TIMEOUT_MS, WHISPER_HEALTH_TIMEOUT_MS)
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
      err instanceof HTTPException
        ? err.message || "درخواست با خطا مواجه شد."
        : "خطای داخلی سرور رخ داد.";
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
    return c.json({ error: "مسیر درخواستی یافت نشد." }, 404);
  });

  return app;
}
