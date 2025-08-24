import {
  convertToModelMessages,
  extractReasoningMiddleware,
  generateId,
  streamText,
  type UIMessage,
  wrapLanguageModel,
} from 'ai';
import { Hono } from 'hono';
import { MessageRoleEnum, MessageStatusEnum } from '../database/schema';
import { saveMessage } from '../repositories/messages';
import { getModelById } from '../repositories/models';
import {
  getThread,
  loadThreadMessages,
  updateThreadOnNewMessage,
} from '../repositories/threads';
import { getProviderForModel } from '../services/ai-providers';
import { convertDbMessagesToUiMessages } from '../utils/chat';

const SYSTEM_PROMPT = `
You are a helpful assistant that can answer questions.
`;

const app = new Hono();

app.post('/', async (c) => {
  try {
    const body = (await c.req.json()) as {
      message: UIMessage;
      modelId: string;
      threadId: string;
    };

    console.log('======> body', body);

    const threadId = body.threadId;
    if (threadId) {
      const thread = await getThread(threadId);
      if (!thread) {
        return c.json({ error: 'Thread not found' }, 404);
      }
    }

    console.log('======> threadId', threadId);

    // Resolve model by id
    const model = await getModelById(body.modelId);
    if (!model) {
      return c.json({ error: 'Model not found' }, 400);
    }
    const providerModel = getProviderForModel(model);

    console.log('======> model', model);

    await saveMessage({
      id: body.message.id,
      parts: body.message.parts,
      modelId: model.id,
      status: MessageStatusEnum.FINISHED,
      threadId,
      role: MessageRoleEnum.USER,
    });

    console.log('======> body.message.id', body.message.id);

    const messages = await loadThreadMessages(threadId);
    console.log('======> messages', messages);

    const result = streamText({
      model: wrapLanguageModel({
        model: providerModel,
        middleware: extractReasoningMiddleware({
          tagName: 'think',
          separator: '\n',
        }),
      }),
      messages: convertToModelMessages(convertDbMessagesToUiMessages(messages)),
      system: SYSTEM_PROMPT,
    });
    console.log('======> result', result);

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
            modelId: model.id,
            status: MessageStatusEnum.FINISHED,
            role: MessageRoleEnum.ASSISTANT,
          });
          await updateThreadOnNewMessage(threadId, new Date());
        } catch (error) {
          console.error('======> error', error);
          return;
        }
      },
    });
  } catch (error) {
    const message =
      error && typeof error === 'object' && 'message' in error
        ? String((error as { message?: unknown }).message)
        : undefined;
    console.error('======> error in chat route', error);
    return c.json({ error: 'Bad request', details: message }, 400);
  }
});

export default app;
