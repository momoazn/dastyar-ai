import "dotenv/config";

import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { RPCHandler } from "@orpc/server/fetch";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createContext } from "./lib/context";
import { appRouter } from "./routers/index";

const ollama = createOpenAICompatible({
  baseURL: "http://localhost:11434/v1",
  name: "ollama",
});

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: process.env.CORS_ORIGIN || "",
    allowMethods: ["GET", "POST", "OPTIONS"],
  })
);

const handler = new RPCHandler(appRouter);
app.use("/rpc/*", async (c, next) => {
  const context = await createContext({ context: c });
  const { matched, response } = await handler.handle(c.req.raw, {
    prefix: "/rpc",
    context,
  });

  if (matched) {
    return c.newResponse(response.body, response);
  }
  await next();
});

app.post("/ai", async (c) => {
  const body = await c.req.json();
  const messages: UIMessage[] = body.messages || [];
  const result = streamText({
    model: ollama("smollm2:1.7b"),
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
});

app.get("/", (c) => {
  return c.text("OK");
});

export default app;
