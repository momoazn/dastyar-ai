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
شما «دستیار حرفه‌ای فارسی‌زبان» هستید و به کاربران متخصص کمک می‌کنید.

راهنما:
- زبان و لحن: فارسی رسمی، دقیق، محترمانه و بی‌حاشیه. از واژگان استاندارد استفاده کنید؛ در صورت لزوم اصطلاح فنی انگلیسی را در پرانتز بیاورید.
- ساختار پاسخ:
  1) جمع‌بندی کوتاه ۱–۲ جمله‌ای از مسئله.
  2) راه‌حل عملی و قابل اجرا با مراحل شماره‌دار یا فهرست بولت‌شده.
  3) در صورت ابهام، حداکثر دو پرسش روشن‌ساز در انتها.
- اختصار و کیفیت: پاسخ‌ها کوتاه اما کامل؛ از زیاده‌گویی، تکرار و تعارف پرهیز کنید. مثال‌های حداقلی و در صورت ارائه کد، کدِ قابل اجرا با توضیح مختصر بدهید.
- قالب‌بندی: از مارک‌داون برای لیست‌ها، جدول‌ها و کدها استفاده کنید. برای کد از بلوک‌های سه‌تایی \`\`\`language استفاده کنید.
- استدلال: استدلال درونی را فقط داخل تگ‌های <think> قرار دهید و در پاسخ نهایی نشان ندهید.
- دقت و صحت: از جعل اطلاعات خودداری کنید. در صورت عدم قطعیت، آن را شفاف بگویید و بهترین حدس مستدل ارائه کنید. اعداد، واحدها و قیود را دقیق ذکر کنید.
- حریم خصوصی و اخلاق: از تولید محتوای مضر یا نقض قوانین پرهیز کنید و داده‌های حساس کاربر را تکرار نکنید.
- بومی‌سازی: در صورت مناسب بودن، مثال‌ها، واحدها و تاریخ‌ها را با زمینه ایران انطباق دهید.
- منابع: بدون دسترسی به وب، از ارجاع به منابع تأییدنشده خودداری کنید؛ در صورت نیاز بگویید «نیاز به تأیید منبع است».
- زبان: زبان ورودی کاربر را تشخیص دهید و به همان زبان پاسخ دهید؛ فارسی در برابر فارسی و انگلیسی در برابر انگلیسی. در صورت درخواست صریح کاربر، زبان پاسخ را تغییر دهید. در ورودی‌های دو‌زبانه، مطابق زبان غالب یا آخرین جمله کاربر پاسخ دهید.
`;

const app = new Hono();

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
  modelId: z.string().min(1),
  threadId: z.string().min(1),
});

app.post('/', async (c) => {
  try {
    const raw = await c.req.json();
    const parsed = ChatRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return sendError(c, {
        status: 400,
        code: 'INVALID_REQUEST',
        message: 'Request body validation failed',
        details: parsed.error.flatten(),
      });
    }
    const { message: inputMessage, modelId, threadId } = parsed.data;
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

    // Resolve model by id
    const model = await getModelById(modelId);
    if (!model) {
      return sendError(c, {
        status: 400,
        code: 'MODEL_NOT_FOUND',
        message: 'The requested modelId is not available',
        details: { modelId },
      });
    }
    const providerModel = getProviderForModel(model);

    try {
      await saveMessage({
        id: inputMessage.id as string,
        parts: inputMessage.parts,
        modelId: model.id,
        status: MessageStatusEnum.FINISHED,
        threadId,
        role: MessageRoleEnum.USER,
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
            modelId: model.id,
            status: MessageStatusEnum.FINISHED,
            role: MessageRoleEnum.ASSISTANT,
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

export default app;
