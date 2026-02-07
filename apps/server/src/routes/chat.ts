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
import { logger } from "@/lib/logger";
import { chatSystemPrompt } from "@/lib/prompts";
import { type AuthEnv, authMiddleware } from "@/middlewares/auth";
import { getModelById } from "@/repositories/llm-models";
import {
  appendMessageParts,
  createMessage,
  updateMessage,
} from "@/repositories/messages";
import { updateThreadOnNewMessage } from "@/repositories/threads";
import { acquireProviderForModel } from "@/services/ai-providers";
import {
  buildContextFromChunks,
  retrieveRelevantChunksForThread,
} from "@/services/processors";
import { getModelSizeCategory, type MyUIMessage } from "@/utils/chat";
import { extractTextFromParts } from "@/utils/text-extractor";

export function sendError(
  c: Context<AuthEnv>,
  params: {
    status: ContentfulStatusCode;
    code: string;
    message: string;
    details?: Record<string, unknown>;
  }
) {
  const { status, code, message, details } = params;
  return c.json({ error: { code, message, details } }, status);
}

const MessagePartSchema = z.union([
  z.object({ type: z.literal("text"), text: z.string() }),
  z.object({
    type: z.literal("image"),
    image: z.string(),
    mimeType: z.string().optional(),
  }),
  z.object({ type: z.literal("reasoning"), text: z.string() }),
  // AI SDK emits step markers for multi-stage responses (e.g., reasoning/tool calls)
  // Allow them through validation so subsequent messages aren't rejected
  z.object({ type: z.literal("step-start") }),
  z.object({
    type: z.literal("tool-call"),
    toolCallId: z.string(),
    toolName: z.string(),
    args: z.record(z.string(), z.unknown()),
  }),
  z.object({
    type: z.literal("tool-result"),
    toolCallId: z.string(),
    result: z.unknown(),
  }),
]);

const ChatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        id: z.string(),
        role: z.enum(["user", "assistant", "system"]),
        parts: z.array(MessagePartSchema).min(1),
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
    let releaseProvider: (() => void) | null = null;
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

      if (!llmModel.isEnabled) {
        return sendError(c, {
          status: 403,
          code: "MODEL_DISABLED",
          message: "The selected model is disabled",
          details: { modelId },
        });
      }

      const providerLease = await acquireProviderForModel(
        llmModel.identifier,
        llmModel.provider
      );
      const providerModel = providerLease.model;
      releaseProvider = providerLease.release;

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
      // Extract plain text from the last user message to use as the retrieval query
      const sizeCategory = getModelSizeCategory(llmModel.size);
      let ragSystem = chatSystemPrompt({ sizeCategory });
      try {
        const userQuery = extractTextFromParts(last).content.slice(0, 2000);
        if (userQuery && threadId) {
          const results = await retrieveRelevantChunksForThread({
            userId: user.id,
            threadId,
            query: userQuery,
            topK: 4,
          });
          if (results.length > 0) {
            const ctx = buildContextFromChunks(results);
            ragSystem = chatSystemPrompt({
              context: ctx,
              sizeCategory,
            });
          }
        }
      } catch (error) {
        logger.error("RAG context retrieval failed", error, {
          threadId,
          userId: user.id,
        });
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
      const flushPartialParts = () => {
        if (!(accumulatedText || accumulatedReasoning)) {
          return;
        }

        const partialParts: JsonValue[] = [];
        if (accumulatedReasoning) {
          partialParts.push({
            type: "reasoning",
            text: accumulatedReasoning,
          } as JsonValue);
          accumulatedReasoning = "";
        }
        if (accumulatedText) {
          partialParts.push({
            type: "text",
            text: accumulatedText,
          } as JsonValue);
          accumulatedText = "";
        }

        const persistPromise = appendMessageParts({
          id: assistantMessage.id,
          parts: partialParts,
          status: "streaming",
        });
        inFlightPersist = persistPromise.catch(() => {
          inFlightPersist = null;
        });
      };

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
            flushPartialParts();
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
            flushPartialParts();
            if (inFlightPersist) {
              await inFlightPersist;
            }
            await updateMessage({
              id: assistantMessage.id,
              parts: responseMessage.parts as JsonValue,
              status: "finished",
            });
            await updateThreadOnNewMessage(threadId, user.id, new Date());
            releaseProvider?.();
            releaseProvider = null;
          } catch {
            releaseProvider?.();
            releaseProvider = null;
            return;
          }
        },
      });
    } catch (error) {
      releaseProvider?.();
      releaseProvider = null;
      let message = "An unexpected error occurred";
      if (error instanceof Error) {
        message = error.message;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "message" in error
      ) {
        message = String((error as { message: unknown }).message);
      }
      return sendError(c, {
        status: 500,
        code: "INTERNAL_SERVER_ERROR",
        message,
      });
    }
  });

export default app;
