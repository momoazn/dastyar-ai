import { zValidator } from '@hono/zod-validator';
import {
  convertToModelMessages,
  extractReasoningMiddleware,
  streamText,
  wrapLanguageModel,
} from 'ai';
import { type Context, Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import type { Prisma } from '@/database';
import { getModelById } from '@/repositories/llm-models';
import { saveMessage } from '@/repositories/messages';
import { updateThreadOnNewMessage } from '@/repositories/threads';
import { getProviderForModel } from '@/services';
import type { MyUIMessage } from '@/utils/chat';
import { CHAT_SYSTEM_PROMPT } from '@/utils/constants';
import { env } from '../config';

// Extend Hono context to include user
declare module 'hono' {
  interface ContextVariableMap {
    user: { id: number; username: string; role: string };
  }
}

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

const JWT_SECRET = env.JWT_SECRET;

const ChatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        id: z.string(),
        role: z.enum(['user', 'assistant', 'system']),
        parts: z.array(z.unknown()).min(1),
        metadata: z.unknown().optional(),
      })
    )
    .min(1),
  modelId: z.coerce.number(),
  threadId: z.coerce.number(),
});

// Authentication middleware
const authMiddleware = async (c: Context, next: () => Promise<void>) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization header',
        },
      },
      401
    );
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      username: string;
      role: string;
    };

    // Fetch user from database to ensure they still exist
    const { prisma } = await import('../database');
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return c.json(
        { error: { code: 'UNAUTHORIZED', message: 'User not found' } },
        401
      );
    }

    // Add user to context
    c.set('user', {
      id: user.id,
      username: user.username,
      role: user.role,
    });

    await next();
  } catch {
    return c.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid token' } },
      401
    );
  }
};

const app = new Hono()
  .use('*', authMiddleware)
  .post('/', zValidator('json', ChatRequestSchema), async (c) => {
    try {
      const { messages, modelId, threadId } = c.req.valid('json');
      const uiMessages = messages as unknown as MyUIMessage[];
      const user = c.get('user');

      const last = uiMessages.at(-1);
      if (!last || last.role !== 'user') {
        return sendError(c, {
          status: 400,
          code: 'INVALID_REQUEST',
          message: 'Last message must be from user',
        });
      }

      const llmModel = await getModelById(modelId);
      if (!llmModel) {
        return sendError(c, {
          status: 404,
          code: 'MODEL_NOT_FOUND',
          message: 'No model exists with the provided id',
          details: { modelId },
        });
      }

      const providerModel = getProviderForModel(
        llmModel.name,
        llmModel.provider
      );

      // Persist user message (last)
      try {
        await saveMessage({
          threadId,
          parts: last.parts as Prisma.InputJsonValue,
          modelId,
          status: 'finished',
          role: 'user',
          userId: user.id,
        });
        await updateThreadOnNewMessage(threadId, user.id, new Date());
      } catch {
        return sendError(c, {
          status: 500,
          code: 'PERSIST_USER_MESSAGE_FAILED',
          message: 'Could not save the user message',
        });
      }

      const modelMessages = convertToModelMessages(uiMessages);

      const result = streamText({
        model: wrapLanguageModel({
          model: providerModel,
          middleware: extractReasoningMiddleware({
            tagName: 'think',
            separator: '\n',
          }),
        }),
        messages: modelMessages,
        system: CHAT_SYSTEM_PROMPT,
        providerOptions: {},
      });

      return result.toUIMessageStreamResponse({
        originalMessages: uiMessages,
        sendReasoning: true,
        onFinish: async ({ responseMessage }) => {
          try {
            await saveMessage({
              threadId,
              parts: responseMessage.parts as Prisma.InputJsonValue,
              modelId,
              status: 'finished',
              role: 'assistant',
              userId: user.id,
            });
            await updateThreadOnNewMessage(threadId, user.id, new Date());
          } catch {
            return;
          }
        },
      });
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: unknown }).message)
          : 'An unexpected error occurred';
      return sendError(c, {
        status: 500,
        code: 'INTERNAL_SERVER_ERROR',
        message,
      });
    }
  });

export default app;
