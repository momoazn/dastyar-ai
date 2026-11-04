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
import { serverTexts } from "@/lib/texts";
import { type AuthEnv, authMiddleware } from "@/middlewares/auth";
import { getModelById } from "@/repositories/llm-models";
import {
  appendMessageParts,
  createMessage,
  updateMessage,
} from "@/repositories/messages";
import { getThread, updateThreadOnNewMessage } from "@/repositories/threads";
import { acquireProviderForModel } from "@/services/ai-providers";
import {
  buildContextFromChunks,
  retrieveRelevantChunksForThread,
} from "@/services/processors";
import { getModelSizeCategory, type MyUIMessage } from "@/utils/chat";
import { extractTextFromParts } from "@/utils/text-extractor";

function sendError(
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

function mapChatErrorMessage(rawMessage: string): string {
  const normalized = rawMessage.trim().toLowerCase();

  if (
    normalized.includes("bad request") ||
    normalized.includes("invalid request") ||
    normalized.includes("validation")
  ) {
    return serverTexts.errors.invalidRequest;
  }

  if (
    normalized.includes("unauthorized") ||
    normalized.includes("invalid token")
  ) {
    return serverTexts.errors.unauthorized;
  }

  if (normalized.includes("forbidden")) {
    return serverTexts.errors.forbidden;
  }

  if (
    normalized.includes("econnrefused") ||
    normalized.includes("network") ||
    normalized.includes("fetch") ||
    normalized.includes("unavailable") ||
    normalized.includes("connection refused")
  ) {
    return serverTexts.chat.providerUnavailable;
  }

  if (normalized.includes("not found")) {
    return serverTexts.errors.notFound;
  }

  return serverTexts.chat.genericFailure;
}

async function markMessageErrored(messageId: number | null): Promise<void> {
  if (messageId === null) {
    return;
  }

  await updateMessage({
    id: messageId,
    status: "errored",
  }).catch(() => {
    return;
  });
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
    let assistantMessageId: number | null = null;
    let releaseProvider: (() => void) | null = null;
    // Set once the stream owns the lease; its onFinish then releases it
    let leaseHandedToStream = false;
    try {
      const { messages, modelId, threadId } = c.req.valid("json");
      const uiMessages = messages as unknown as MyUIMessage[];
      const user = c.get("user");

      const last = uiMessages.at(-1);
      if (!last || last.role !== "user") {
        return sendError(c, {
          status: 400,
          code: "INVALID_REQUEST",
          message: serverTexts.chat.lastMessageMustBeUser,
        });
      }

      // The thread must exist and belong to the user
      const thread = await getThread(threadId, user.id);
      if (!thread) {
        return sendError(c, {
          status: 404,
          code: "THREAD_NOT_FOUND",
          message: serverTexts.chat.threadNotFound,
          details: { threadId },
        });
      }

      const llmModel = await getModelById(modelId);
      if (!llmModel) {
        return sendError(c, {
          status: 404,
          code: "MODEL_NOT_FOUND",
          message: serverTexts.chat.modelNotFound,
          details: { modelId },
        });
      }

      if (!llmModel.isEnabled) {
        return sendError(c, {
          status: 403,
          code: "MODEL_DISABLED",
          message: serverTexts.chat.inactiveModel,
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
          message: serverTexts.chat.saveUserMessageFailed,
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
      assistantMessageId = assistantMessage.id;

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

      let streamFailed = false;
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
        onError: ({ error }) => {
          streamFailed = true;
          logger.error("Chat stream failed", error, {
            threadId,
            userId: user.id,
          });
        },
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

      const response = result.toUIMessageStreamResponse({
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
              status: streamFailed ? "errored" : "finished",
            });
            await updateThreadOnNewMessage(threadId, user.id, new Date());
          } catch {
            await markMessageErrored(assistantMessageId);
          } finally {
            releaseProvider?.();
            releaseProvider = null;
          }
        },
      });
      leaseHandedToStream = true;
      return response;
    } catch (error) {
      await markMessageErrored(assistantMessageId);
      let message: string = serverTexts.chat.genericFailure;
      if (error instanceof Error) {
        message = mapChatErrorMessage(error.message);
      } else if (
        typeof error === "object" &&
        error !== null &&
        "message" in error
      ) {
        message = mapChatErrorMessage(
          String((error as { message: unknown }).message)
        );
      }
      return sendError(c, {
        status: 500,
        code: "INTERNAL_SERVER_ERROR",
        message,
      });
    } finally {
      // Every path that did not start the stream must free the lease
      if (!leaseHandedToStream) {
        releaseProvider?.();
        releaseProvider = null;
      }
    }
  });

export default app;
