import "dotenv/config";

import { RPCHandler } from "@orpc/server/fetch";
import {
	convertToModelMessages,
	extractReasoningMiddleware,
	streamText,
	type UIMessage,
	wrapLanguageModel,
} from "ai";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { z } from "zod";
import { runMigrations } from "./db/migrate";
import { lmstudio, ollama, resolveModel } from "./lib/ai";
import {
	getMessagesByThread,
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

app.post("/chat", async (c) => {
	try {
		const schema = z.object({
			messages: z.array(z.any()).default([]),
			model: z.string().optional(),
			provider: z
				.enum([
					"ollama",
					"lmstudio",
					"openai",
					"anthropic",
					"gemini",
					"mistral",
					"openrouter",
					"requesty",
				])
				.optional(),
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

		// (Removed) Early persistence to avoid double-saving user message. We persist below

		// Build full conversation history to send to the model
		let history: UIMessage[] = uiMessages;
		if (threadId) {
			try {
				const rows = await getMessagesByThread({ threadId });
				const asc = [...rows].reverse();
				history = asc.map((row) => ({
					id: row.id,
					role: row.role as "user" | "assistant",
					parts: [
						{ type: "text", text: row.content ?? "" },
						// keep reasoning separate in UI; do not include as prompt content
					],
				}));
			} catch {}
		}

		// Persist the latest user message prior to generation and include it in the prompt
		try {
			const lastUser = [...uiMessages].reverse().find((m) => m.role === "user");
			if (threadId && lastUser) {
				let text = "";
				for (const part of lastUser.parts)
					if (part.type === "text") text += part.text;
				if (text.trim().length > 0) {
					await saveMessage({
						threadId,
						role: "user",
						content: text,
						model: null,
						status: "submitted",
					});
					await updateThreadOnNewMessage(threadId);
					// also include it at the end of the history sent to the model
					history = [
						...history,
						{
							id: generateId(15),
							role: "user",
							parts: [{ type: "text", text }],
						},
					];
				}
			}
		} catch {}

		const selectedProvider = body.provider ?? "ollama";
		const modelId =
			selectedProvider === "ollama"
				? await resolveModel(body.model)
				: (body.model ?? "");
		const providerModel =
			selectedProvider === "lmstudio" ? lmstudio(modelId) : ollama(modelId);
		const result = streamText({
			model: wrapLanguageModel({
				model: providerModel,
				middleware: extractReasoningMiddleware({
					tagName: "think",
					separator: "\n",
				}),
			}),
			messages: convertToModelMessages(history),
			system: body.system,
		});

		return result.toUIMessageStreamResponse({
			originalMessages: uiMessages,
			generateMessageId: () => generateId(15),
			sendReasoning: true,
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
