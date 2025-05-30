import app from "./routes";

Bun.serve({
  fetch: app.fetch,
  port: 3000,
});
