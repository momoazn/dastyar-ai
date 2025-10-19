import { zValidator } from "@hono/zod-validator";
import {
  convertToModelMessages,
  extractReasoningMiddleware,
  streamText,
  wrapLanguageModel,
} from "ai";
import { type Context, Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { z } from "zod";
import type { JsonValue } from "@/database";
import { type AuthEnv, authMiddleware } from "@/middlewares/auth";
import { getModelById } from "@/repositories/llm-models";
import { createMessage, updateMessage } from "@/repositories/messages";
import { updateThreadOnNewMessage } from "@/repositories/threads";
import { getProviderForModel } from "@/services/llm-providers";
import {
  buildContextFromChunks,
  retrieveRelevantChunksForThread,
} from "@/services/rag";
import type { MyUIMessage } from "@/utils/chat";
import { CHAT_SYSTEM_PROMPT } from "@/utils/constants";

export function sendError(
  c: Context<AuthEnv>,
  params: {
    status: ContentfulStatusCode;
    code: string;
    message: string;
    details?: unknown;
  }
) {
  const { status, code, message, details } = params;
  return c.json({ error: { code, message, details } }, status);
}

const ChatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        id: z.string(),
        role: z.enum(["user", "assistant", "system"]),
        parts: z.array(z.unknown()).min(1),
        metadata: z.unknown().optional(),
      })
    )
    .min(1),
  modelId: z.coerce.number(),
  threadId: z.coerce.number(),
});

const app = new Hono<AuthEnv>()
  .use(authMiddleware)
  .post("/", zValidator("json", ChatRequestSchema), async (c) => {
    try {
      const { messages, modelId, threadId } = c.req.valid("json");
      const uiMessages = messages as unknown as MyUIMessage[];
      const user = c.get("user");

      const last = uiMessages.at(-1);
      if (!last || last.role !== "user") {
        return sendError(c, {
          status: 400,
          code: "INVALID_REQUEST",
          message: "Last message must be from user",
        });
      }

      const llmModel = await getModelById(modelId);
      if (!llmModel) {
        return sendError(c, {
          status: 404,
          code: "MODEL_NOT_FOUND",
          message: "No model exists with the provided id",
          details: { modelId },
        });
      }

      const providerModel = getProviderForModel(
        llmModel.name,
        llmModel.provider
      );

      // Persist user message (last)
      try {
        await createMessage({
          threadId,
          parts: last.parts as JsonValue,
          modelId,
          status: "finished",
          role: "user",
          userId: user.id,
        });
        await updateThreadOnNewMessage(threadId, user.id, new Date());
      } catch {
        return sendError(c, {
          status: 500,
          code: "PERSIST_USER_MESSAGE_FAILED",
          message: "Could not save the user message",
        });
      }

      const modelMessages = convertToModelMessages(uiMessages);

      // Build RAG context from any documents attached to this thread
      // 1) Extract plain text from the last user message to use as the retrieval query
      const extractTextFromParts = (parts: unknown[]): string => {
        try {
          let text = "";
          for (const p of parts as unknown[]) {
            if (!p || typeof p !== "object") {
              continue;
            }
            const candidate = p as Record<string, unknown>;
            const typeVal = candidate.type as unknown;
            const textVal = candidate.text as unknown;
            if (typeVal === "text" && typeof textVal === "string") {
              text += textVal;
            }
          }
          return text;
        } catch {
          return "";
        }
      };

      let ragSystem = CHAT_SYSTEM_PROMPT;
      try {
        const userQuery = extractTextFromParts(last.parts as unknown[]).slice(
          0,
          2000
        );
        if (userQuery && threadId) {
          const results = await retrieveRelevantChunksForThread({
            userId: user.id,
            threadId,
            query: userQuery,
            topK: 4,
          });
          if (results.length > 0) {
            const ctx = buildContextFromChunks(results);
            ragSystem = `${CHAT_SYSTEM_PROMPT}\n\n[CONTEXT]\n${ctx}\n[/CONTEXT]\n\nراهنما: فقط بر اساس «CONTEXT» پاسخ بده. در متن پاسخ، در صورت ارجاع به منابع از یادداشت‌های [1]، [2] و ... استفاده کن و عنوان/شماره صفحه را به اختصار بیاور. اگر پاسخ در منابع نبود، واضح بگو «در منابع موجود نیست».`;
          }
        }
      } catch (_e) {
        // Retrieval is best-effort; fall back to default system prompt on failure
      }

      const assistantMessage = await createMessage({
        modelId,
        parts: [],
        role: "assistant",
        status: "streaming",
        threadId,
        userId: user.id,
      });

      // Accumulate assistant text and reasoning and persist in AI SDK parts format with a 500ms throttle
      const throttledUpdateIntervalMs = 500;
      let accumulatedText = "";
      let accumulatedReasoning = "";
      let lastPersistTime = 0;
      let inFlightPersist: Promise<void> | null = null;

      const result = streamText({
        model: wrapLanguageModel({
          model: providerModel,
          middleware: extractReasoningMiddleware({
            tagName: "think",
            separator: "\n",
          }),
        }),
        messages: modelMessages,
        system: ragSystem,
        providerOptions: {},
        onChunk: ({ chunk }) => {
          if (chunk.type === "text-delta") {
            accumulatedText += chunk.text;
          } else if (chunk.type === "reasoning-delta") {
            accumulatedReasoning += chunk.text;
          }

          const now = Date.now();
          if (now - lastPersistTime >= throttledUpdateIntervalMs) {
            lastPersistTime = now;

            const partialParts: unknown[] = [];
            if (accumulatedReasoning) {
              partialParts.push({
                type: "reasoning",
                text: accumulatedReasoning,
              });
            }
            if (accumulatedText) {
              partialParts.push({ type: "text", text: accumulatedText });
            }

            const persistPromise = updateMessage({
              id: assistantMessage.id,
              parts: partialParts as JsonValue,
              status: "streaming",
            });
            inFlightPersist = persistPromise.catch(() => {
              // On transient failure we drop this update and wait for next tick
              inFlightPersist = null;
            });
          }
        },
      });

      // Ensure stream runs to completion and onFinish is triggered even if client disconnects
      result.consumeStream();

      return result.toUIMessageStreamResponse({
        originalMessages: uiMessages,
        sendReasoning: true,
        onFinish: async ({ responseMessage }) => {
          try {
            if (inFlightPersist) {
              await inFlightPersist;
            }
            await updateMessage({
              id: assistantMessage.id,
              parts: responseMessage.parts as JsonValue,
              status: "finished",
            });
            await updateThreadOnNewMessage(threadId, user.id, new Date());
          } catch {
            return;
          }
        },
      });
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: unknown }).message)
          : "An unexpected error occurred";
      return sendError(c, {
        status: 500,
        code: "INTERNAL_SERVER_ERROR",
        message,
      });
    }
  });

export default app;
