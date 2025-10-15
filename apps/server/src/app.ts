import { existsSync } from "node:fs";
import { join } from "node:path";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { env, isProduction, runtimeBaseDir, webDistDir } from "./config";
import chatHandler from "./routes/chat";
import imagesHandler from "./routes/images";
import orpcHandler from "./routes/rpc";

console.log("starting app with env", env);

export function createApp() {
  const app = new Hono();

  // Logger middleware
  app.use(logger());

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
  app.get("/healthz", (c) => c.text("ok", 200));

  const spaRootExists = existsSync(webDistDir);
  const spaIndexPath = join(webDistDir, "index.html");
  const spaIndexExists = spaRootExists && existsSync(spaIndexPath);
  const bunExecutable = typeof Bun !== "undefined" ? Bun.argv?.[0] : undefined;
  console.log("SPA Debug Info:", {
    isProduction: isProduction(),
    webDistDir,
    spaRootExists,
    spaIndexPath,
    spaIndexExists,
    runtimeBaseDir,
    configuredWebDist: env.WEB_DIST_DIR,
    bunExecutable,
    processExecPath: process.execPath,
    processArgv0: process.argv?.[0],
    processCwd: process.cwd(),
    platform: process.platform,
  });
  // if (spaRootExists) {
  app.use(
    "/*",
    serveStatic({
      root: webDistDir,
    })
  );
  // }

  // Global error handler
  app.onError((err, c) => {
    // Log the error for observability
    console.error(err);
    const status = err instanceof HTTPException ? err.status : 500;
    const message =
      err instanceof HTTPException ? err.message : "Internal Server Error";
    return c.json({ error: message }, status);
  });

  // 404 handler
  app.notFound((c) => c.json({ error: "Not Found" }, 404));
  // if (spaIndexExists) {
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
  // }

  return app;
}
