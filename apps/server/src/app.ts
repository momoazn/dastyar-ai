import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { env } from "./config";
import chatHandler from "./routes/chat";
import imagesHandler from "./routes/images";
import orpcHandler from "./routes/rpc";

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

  // Simple health check endpoint
  app.get("/", (c) => c.text("Server is running", 200));

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

  return app;
}
