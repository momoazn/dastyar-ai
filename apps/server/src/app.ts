import { Hono } from "hono";
import { cors } from "hono/cors";
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

  return app;
}
