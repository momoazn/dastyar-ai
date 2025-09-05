import {
  convertToModelMessages,
  extractReasoningMiddleware,
  generateId,
  smoothStream,
  streamText,
  wrapLanguageModel,
} from 'ai';
import type { Context } from 'hono';
import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { z } from 'zod';
import { saveMessage } from '@/repositories/messages';
import {
  getThread,
  loadThreadMessages,
  updateThreadOnNewMessage,
} from '@/repositories/threads';
import { getProviderForModel } from '@/services';
import { convertDbMessagesToUiMessages } from '@/utils/chat';
import { CHAT_SYSTEM_PROMPT } from '@/utils/constants';

const chatRouter = new Hono();

// Unified error response helper
const sendError = (
  c: Context,
  params: {
    status: ContentfulStatusCode;
    code: string;
    message: string;
    details?: unknown;
  }
) => {
  const { status, code, message, details } = params;
  return c.json({ error: { code, message, details } }, status);
};

// Request validation
const ChatRequestSchema = z.object({
  message: z.object({
    id: z.string().min(1),
    role: z.literal('user'),
    parts: z.array(z.unknown()).min(1),
    metadata: z.unknown().optional(),
  }),
  modelProvider: z
    .enum(['ollama', 'lmstudio', 'openrouter', 'groq', 'gemini'])
    .optional()
    .default('ollama'),
  modelName: z.string().min(1),
  threadId: z.string().min(1),
});

chatRouter.post('/', async (c) => {
  try {
    const raw = await c.req.json();
    const parsed = ChatRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return sendError(c, {
        status: 400,
        code: 'INVALID_REQUEST',
        message: 'Request body validation failed',
        details: z.treeifyError(parsed.error),
      });
    }
    const {
      message: inputMessage,
      modelName,
      threadId,
      modelProvider,
    } = parsed.data;
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
        id: inputMessage.id as string,
        parts: inputMessage.parts,
        status: 'finished',
        role: 'user',
        modelName,
        threadId,
      });
    } catch (err) {
      const log = c.get('log' as never) as
        | { error: (o?: unknown, m?: string) => void }
        | undefined;
      log?.error({ err }, 'failed to persist user message');
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
      const log = c.get('log' as never) as
        | { error: (o?: unknown, m?: string) => void }
        | undefined;
      log?.error({ err }, 'failed to load thread messages');
      return sendError(c, {
        status: 500,
        code: 'LOAD_MESSAGES_FAILED',
        message: 'Failed to load thread messages',
      });
    }

    // // Prepare messages. Ollama's /api/chat expects string content per message.
    // const uiMessages = convertDbMessagesToUiMessages(messages);
    // let preparedMessages: unknown;
    // if (modelProvider === 'ollama') {
    //   preparedMessages = uiMessages.map((m) => ({
    //     role: m.role,
    //     content:
    //       m.parts
    //         .map((part) => {
    //           if (typeof part === 'string') {
    //             return part;
    //           }
    //           if (part && typeof part === 'object' && 'text' in part) {
    //             const maybeText = (part as { text?: unknown }).text;
    //             return typeof maybeText === 'string' ? maybeText : '';
    //           }
    //           return '';
    //         })
    //         .filter(Boolean)
    //         .join('\n') || ' ',
    //   }));
    // } else {
    //   preparedMessages = convertToModelMessages(uiMessages);
    // }

    const result = streamText({
      model: wrapLanguageModel({
        model: providerModel,
        middleware: extractReasoningMiddleware({
          tagName: 'think',
          separator: '\n',
        }),
      }),
      messages: convertToModelMessages(convertDbMessagesToUiMessages(messages)),
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
      generateMessageId: () => generateId(),
      sendReasoning: true,
      onFinish: async ({ responseMessage }) => {
        if (!threadId) {
          return;
        }
        try {
          await saveMessage({
            id: responseMessage.id,
            threadId,
            parts: responseMessage.parts,
            modelName,
            status: 'finished',
            role: 'assistant',
          });
          await updateThreadOnNewMessage(threadId, new Date());
        } catch (error) {
          const log = c.get('log' as never) as
            | { error: (o?: unknown, m?: string) => void }
            | undefined;
          log?.error({ err: error }, 'failed to persist assistant message');
          return;
        }
      },
    });
  } catch (error) {
    const message =
      error && typeof error === 'object' && 'message' in error
        ? String((error as { message?: unknown }).message)
        : 'An unexpected error occurred';
    const log = c.get('log' as never) as
      | { error: (o?: unknown, m?: string) => void }
      | undefined;
    log?.error({ err: error }, 'chat route error');
    return sendError(c, {
      status: 500,
      code: 'INTERNAL_SERVER_ERROR',
      message,
    });
  }
});

export default chatRouter;
