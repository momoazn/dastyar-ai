import "dotenv/config";

import { RPCHandler } from "@orpc/server/fetch";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { z } from "zod";
import { runMigrations } from "./db/migrate";
import { ollama, resolveModel } from "./lib/ai";
import {
	getThread,
	saveMessage,
	updateThreadOnNewMessage,
} from "./lib/chat-store";
import { createContext } from "./lib/context";
import { generateId } from "./lib/ids";
import { appRouter } from "./routers/index";

// Provider is configured in lib/ai.ts

const app = new Hono();

app.use(logger());
app.use(async (c, next) => {
	// Ensure migrations are applied once per process
	await runMigrations();
	await next();
});
app.use(
	"/*",
	cors({
		origin: process.env.CORS_ORIGIN || "",
		allowMethods: ["GET", "POST", "OPTIONS"],
	}),
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
	try {
		const schema = z.object({
			messages: z.array(z.any()).default([]),
			model: z.string().optional(),
			threadId: z.string().optional(),
			system: z.string().optional(),
		});
		const body = schema.parse(await c.req.json());
		const uiMessages: UIMessage[] = body.messages as UIMessage[];

		// Ensure thread exists if provided, otherwise optionally create one
		const threadId = body.threadId;
		if (threadId) {
			const t = await getThread(threadId);
			if (!t) {
				return c.json({ error: "Thread not found" }, 404);
			}
		}

		const modelId = await resolveModel(body.model);
		const result = streamText({
			model: ollama(modelId),
			messages: convertToModelMessages(uiMessages),
			system: body.system,
		});

		return result.toUIMessageStreamResponse({
			originalMessages: uiMessages,
			generateMessageId: () => generateId(15),
			onFinish: async ({ responseMessage }) => {
				try {
					// If no threadId, skip persistence silently
					if (!threadId) return;
					await saveMessage({
						threadId,
						role: "assistant",
						uiMessage: responseMessage,
						model: modelId,
						status: "finished",
					});
					await updateThreadOnNewMessage(threadId);
				} catch {}
			},
		});
	} catch (err) {
		return c.json({ error: "Bad request" }, 400);
	}
});

app.get("/", (c) => {
	return c.text("OK");
});

export default app;
