import { zValidator } from '@hono/zod-validator';
import {
  convertToModelMessages,
  extractReasoningMiddleware,
  smoothStream,
  streamText,
  wrapLanguageModel,
} from 'ai';
import { type Context, Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { z } from 'zod';
import type { Prisma } from '@/database';
import { saveMessage } from '@/repositories/messages';
import {
  getThread,
  loadThreadMessages,
  updateThreadOnNewMessage,
} from '@/repositories/threads';
import { getProviderForModel } from '@/services';
import { convertDbMessagesToUiMessages } from '@/utils/chat';
import { CHAT_SYSTEM_PROMPT } from '@/utils/constants';

export function sendError(
  c: Context,
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
  message: z.object({
    id: z.number(),
    role: z.literal('user'),
    parts: z.array(z.unknown()).min(1),
    metadata: z.unknown().optional(),
  }),
  modelProvider: z.enum(['ollama', 'lmstudio']).optional().default('ollama'),
  modelName: z.string().min(1),
  threadId: z.number(),
});

const app = new Hono().post(
  '/',
  zValidator('json', ChatRequestSchema),
  async (c) => {
    try {
      const {
        message: inputMessage,
        modelName,
        threadId,
        modelProvider,
      } = c.req.valid('json');

      if (threadId) {
        const thread = await getThread(threadId);
        if (!thread) {
          return sendError(c, {
            status: 404,
            code: 'THREAD_NOT_FOUND',
            message: 'No thread exists with the provided id',
            details: { threadId },
          });
        }
      }

      const providerModel = getProviderForModel(modelName, modelProvider);

      try {
        await saveMessage({
          parts: inputMessage.parts as Prisma.InputJsonValue,
          status: 'finished',
          role: 'user',
          modelName,
          threadId,
        });
      } catch (err) {
        console.error('failed to persist user message', err);
        return sendError(c, {
          status: 500,
          code: 'PERSIST_USER_MESSAGE_FAILED',
          message: 'Could not save the user message',
          details: undefined,
        });
      }

      let messages: Awaited<ReturnType<typeof loadThreadMessages>>;
      try {
        messages = await loadThreadMessages(threadId);
      } catch (err) {
        console.error('failed to load thread messages', err);
        return sendError(c, {
          status: 500,
          code: 'LOAD_MESSAGES_FAILED',
          message: 'Failed to load thread messages',
        });
      }

      const result = streamText({
        model: wrapLanguageModel({
          model: providerModel,
          middleware: extractReasoningMiddleware({
            tagName: 'think',
            separator: '\n',
          }),
        }),
        messages: convertToModelMessages(
          convertDbMessagesToUiMessages(messages)
        ),
        system: CHAT_SYSTEM_PROMPT,
        providerOptions: {
          // ollama: { think: true },
        },
        experimental_transform: smoothStream({
          delayInMs: 10,
          chunking: 'word',
        }),
      });

      return result.toUIMessageStreamResponse({
        originalMessages: convertDbMessagesToUiMessages(messages),
        generateMessageId: () => Math.random().toString(36).substring(2, 15),
        sendReasoning: true,
        onFinish: async ({ responseMessage }) => {
          if (!threadId) {
            return;
          }
          try {
            await saveMessage({
              threadId,
              parts: responseMessage.parts as Prisma.InputJsonValue,
              modelName,
              status: 'finished',
              role: 'assistant',
            });
            await updateThreadOnNewMessage(threadId, new Date());
          } catch (error) {
            console.error('failed to persist assistant message', error);
            return;
          }
        },
      });
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: unknown }).message)
          : 'An unexpected error occurred';
      console.error('chat route error', error);
      return sendError(c, {
        status: 500,
        code: 'INTERNAL_SERVER_ERROR',
        message,
      });
    }
  }
);

export default app;
