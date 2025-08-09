import {
  convertToModelMessages,
  extractReasoningMiddleware,
  streamText,
  type UIMessage,
  wrapLanguageModel,
} from 'ai';
import { Hono } from 'hono';
import { z } from 'zod';
import { getProviderForModel } from '../lib/ai';
import {
  getMessagesByThread,
  getModelById,
  getModelByName,
  getThread,
  saveMessage,
  updateThreadOnNewMessage,
} from '../lib/repository';
import { generateId } from '../lib/utils';

const app = new Hono();

const sendMessageSchema = z.object({
  messages: z.array(z.any()).default([]),
  modelId: z.string(),
  threadId: z.string(),
  system: z.string().optional(),
});

app.post('/', async (c) => {
  try {
    const body = sendMessageSchema.parse(await c.req.json());
    const uiMessages: UIMessage[] = body.messages as UIMessage[];

    // Ensure thread exists if provided, otherwise optionally create one
    const threadId = body.threadId;
    if (threadId) {
      const t = await getThread(threadId);
      if (!t) {
        return c.json({ error: 'Thread not found' }, 404);
      }
    }

    // Build full conversation history to send to the model
    let history: UIMessage[] = await buildHistory(threadId, uiMessages);

    // Persist the latest user message prior to generation and include it in the prompt
    const appendedUserMessage = await persistLatestUserMessage(
      threadId,
      uiMessages
    );
    if (appendedUserMessage) {
      history = [...history, appendedUserMessage];
    }

    // Accept either database model id or provider model name
    let model = await getModelById(body.modelId);
    if (!model) {
      model = await getModelByName(body.modelId);
    }
    if (!model) {
      return c.json({ error: 'Model not found' }, 400);
    }
    const providerModel = getProviderForModel(model);

    const result = streamText({
      model: wrapLanguageModel({
        model: providerModel,
        middleware: extractReasoningMiddleware({
          tagName: 'think',
          separator: '\n',
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
        // If no threadId, skip persistence silently
        if (!threadId) {
          return;
        }
        try {
          await saveMessage({
            threadId,
            role: 'assistant',
            uiMessage: responseMessage,
            modelId: model.id,
            status: 'finished',
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

const buildHistory = async (
  historyThreadId: string | undefined,
  historyMessages: UIMessage[]
): Promise<UIMessage[]> => {
  if (!historyThreadId) {
    return historyMessages;
  }
  const rows = await getMessagesByThread({ threadId: historyThreadId });
  const asc = [...rows].reverse();
  return asc.map((row) => ({
    id: row.id,
    role: row.role as 'user' | 'assistant',
    parts: [
      { type: 'text', text: row.content ?? '' },
      // keep reasoning separate in UI; do not include as prompt content
    ],
  }));
};

const extractTextFromParts = (parts: UIMessage['parts']): string => {
  let text = '';
  for (const part of parts) {
    if (part.type === 'text') {
      text += part.text;
    }
  }
  return text;
};

const persistLatestUserMessage = async (
  persistThreadId: string | undefined,
  persistMessages: UIMessage[]
): Promise<UIMessage | undefined> => {
  if (!persistThreadId) {
    return;
  }
  const lastUser = [...persistMessages]
    .reverse()
    .find((m) => m.role === 'user');
  if (!lastUser) {
    return;
  }
  const text = extractTextFromParts(lastUser.parts);
  if (text.trim().length === 0) {
    return;
  }
  await saveMessage({
    threadId: persistThreadId,
    role: 'user',
    content: text,
    modelId: null,
    status: null,
  });
  await updateThreadOnNewMessage(persistThreadId);
  return {
    id: generateId(15),
    role: 'user',
    parts: [{ type: 'text', text }],
  } satisfies UIMessage;
};

export default app;
