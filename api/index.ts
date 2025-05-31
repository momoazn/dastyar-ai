import app from "./routes";

Bun.serve({
  fetch: app.fetch,
  port: 3000,
});

console.log(`🚀 API Server running on http://localhost:3000`);
