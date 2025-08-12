import {
  convertToModelMessages,
  extractReasoningMiddleware,
  streamText,
  type UIMessage,
  wrapLanguageModel,
} from 'ai';
import { Hono } from 'hono';
import { z } from 'zod';
import { getProviderForModel } from '../lib/providers';
import {
  getMessagesByThread,
  getModelById,
  getModelByName,
  getThread,
  saveMessages,
  updateMessage,
  updateThreadOnNewMessage,
} from '../lib/repository';
import { extractTextFromParts, generateId } from '../lib/utils';

const app = new Hono();

const sendMessageSchema = z.object({
  messages: z.array(z.any()).default([]),
  modelId: z.string(),
  threadId: z.string(),
});

app.post('/', async (c) => {
  try {
    const body = sendMessageSchema.parse(await c.req.json());
    const uiMessages: UIMessage[] = body.messages as UIMessage[];

    const threadId = body.threadId;
    if (threadId) {
      const thread = await getThread(threadId);
      if (!thread) {
        return c.json({ error: 'Thread not found' }, 404);
      }
    }

    // Resolve model by id or name
    let model = await getModelById(body.modelId);
    if (!model) {
      model = await getModelByName(body.modelId);
    }
    if (!model) {
      return c.json({ error: 'Model not found' }, 400);
    }
    const providerModel = getProviderForModel(model);

    // Persist latest user text and create assistant placeholder (single DB hit)
    const latestUserText = getLatestUserText(uiMessages);
    let assistantPlaceholderId: string | undefined;
    if (threadId && latestUserText) {
      const result = await saveMessages([
        {
          threadId,
          role: 'user',
          content: latestUserText,
          modelId: null,
          status: null,
        },
        {
          threadId,
          role: 'assistant',
          content: '',
          modelId: model.id,
          status: 'streaming',
        },
      ]);
      assistantPlaceholderId = result.ids[1];
      await updateThreadOnNewMessage(threadId);
    }

    // Build conversation history excluding the assistant placeholder (if any)
    const history: UIMessage[] = threadId
      ? await loadThreadHistory(threadId, assistantPlaceholderId)
      : [];

    const result = streamText({
      model: wrapLanguageModel({
        model: providerModel,
        middleware: extractReasoningMiddleware({
          tagName: 'think',
          separator: '\n',
        }),
      }),
      messages: convertToModelMessages(history),
      system: 'You are a helpful assistant that can answer questions.',
    });

    return result.toUIMessageStreamResponse({
      originalMessages: uiMessages,
      generateMessageId: () => generateId(15),
      sendReasoning: true,
      onFinish: async ({ responseMessage }) => {
        if (!threadId) {
          return;
        }
        try {
          const { content, reasoning } = extractTextFromParts(responseMessage);
          await updateMessage({
            id: assistantPlaceholderId as string,
            content,
            reasoning,
            modelId: model.id,
            status: 'finished',
            sentAt: new Date(),
          });
          await updateThreadOnNewMessage(threadId);
        } catch {
          return;
        }
      },
    });
  } catch (error) {
    const message =
      error && typeof error === 'object' && 'message' in error
        ? String((error as { message?: unknown }).message)
        : undefined;
    return c.json({ error: 'Bad request', details: message }, 400);
  }
});

const loadThreadHistory = async (
  threadId: string,
  excludeMessageId?: string
): Promise<UIMessage[]> => {
  const rows = await getMessagesByThread({ threadId });
  const ascending = [...rows].reverse();
  const filtered = excludeMessageId
    ? ascending.filter((row) => row.id !== excludeMessageId)
    : ascending;
  return filtered.map((row) => ({
    id: row.id,
    role: row.role as 'user' | 'assistant',
    parts: [{ type: 'text', text: row.content ?? '' }],
  }));
};

const getLatestUserText = (messages: UIMessage[]): string | undefined => {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message.role !== 'user') {
      continue;
    }
    const combined = message.parts
      .reduce((acc, part) => {
        if (part.type === 'text') {
          return acc + part.text;
        }
        return acc;
      }, '')
      .trim();
    if (combined.length > 0) {
      return combined;
    }
    return;
  }
  return;
};

export default app;
