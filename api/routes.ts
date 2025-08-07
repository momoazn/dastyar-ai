import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { streamSSE } from "hono/streaming";
import { ollama } from "ollama-ai-provider";
import z from "zod";

import { generateObject, streamText } from "ai";
import {
  MessagesRoleOptions,
  MessagesStatusOptions,
  TranslationsSourceLanguageOptions,
  TranslationsTargetLanguageOptions,
  TranslationsToneOptions,
} from "../src/lib/pocketbase-types";
import { Database } from "./database";
import { convertToCoreMessages, parseReasoningTokens } from "./utils";

const db = new Database();

const languageCodeToName: Record<
  TranslationsSourceLanguageOptions | TranslationsTargetLanguageOptions,
  string
> = {
  fa: "Persian",
  en: "English",
  ar: "Arabic",
  fr: "French",
  de: "German",
  es: "Spanish",
} as const;

const chatSchema = z.object({
  message: z.string(),
  threadId: z.string(),
  model: z.string(),
});

const translationSchema = z.object({
  sourceText: z.string(),
  sourceLanguage: z.nativeEnum(TranslationsSourceLanguageOptions),
  targetLanguage: z.nativeEnum(TranslationsTargetLanguageOptions),
  tone: z.nativeEnum(TranslationsToneOptions),
  model: z.string(),
});

const app = new Hono()
  .use("*", cors())
  .get("/health", (c) => {
    return c.json({ status: "ok", timestamp: new Date().toISOString() }, 200);
  })
  .post("/api/chat", zValidator("json", chatSchema), async (c) => {
    const body = (await c.req.json()) as {
      message: string;
      threadId: string;
      model: string;
    };

    if (!body.message || !body.threadId || !body.model) {
      return c.json({ error: "Message, threadId and model are required" }, 400);
    }

    const messages = await db.getMessages(body.threadId);
    const messagesToSend = convertToCoreMessages(messages);
    messagesToSend.push({
      role: "user",
      content: body.message,
    });

    // Create user message in PocketBase
    await db.createMessage({
      threadId: body.threadId,
      content: body.message,
      role: MessagesRoleOptions.user,
      status: MessagesStatusOptions.finished,
      model: body.model,
    });

    // Create assistant message placeholder
    const assistantMessage = await db.createMessage({
      threadId: body.threadId,
      content: "",
      role: MessagesRoleOptions.assistant,
      status: MessagesStatusOptions.idle,
      model: body.model,
    });

    await db.updateThread(body.threadId, {
      lastMessageAt: new Date().toISOString(),
    });

    return streamSSE(c, async (stream) => {
      let accumulatedFullResponse = "";
      let accumulatedReasoning = "";
      let accumulatedResponse = "";
      let lastUpdateTime = Date.now();
      const updateInterval = 100;

      await db.updateMessage(assistantMessage.id, {
        status: MessagesStatusOptions.streaming,
      });

      try {
        const result = streamText({
          model: ollama(body.model),
          messages: messagesToSend,
        });

        for await (const delta of result.textStream) {
          accumulatedFullResponse += delta;

          const { reasoning: newReasoning, response: newResponse } =
            parseReasoningTokens(accumulatedFullResponse);

          accumulatedReasoning = newReasoning;
          accumulatedResponse = newResponse;

          // Send to client
          await stream.writeSSE({
            data: JSON.stringify({
              type: "delta",
              content: delta,
            }),
          });

          const now = Date.now();
          if (now - lastUpdateTime >= updateInterval) {
            await db.updateMessage(assistantMessage.id, {
              reasoning: accumulatedReasoning,
              content: accumulatedResponse,
              status: MessagesStatusOptions.streaming,
            });
            lastUpdateTime = now;
          }

          if (stream.aborted || stream.closed) {
            break;
          }
        }

        const finalStatus = stream.aborted
          ? MessagesStatusOptions.stopped
          : MessagesStatusOptions.finished;

        // Final database update
        await db.updateMessage(assistantMessage.id, {
          content: accumulatedResponse,
          reasoning: accumulatedReasoning,
          status: finalStatus,
        });

        // Send completion event
        await stream.writeSSE({
          data: JSON.stringify({
            type: "complete",
            content: accumulatedResponse,
            reasoning: accumulatedReasoning,
          }),
        });
      } catch (error) {
        const finalStatus = stream.aborted
          ? MessagesStatusOptions.stopped
          : MessagesStatusOptions.errored;

        await db.updateMessage(assistantMessage.id, {
          status: finalStatus,
        });

        await stream.writeSSE({
          data: JSON.stringify({
            type: "error",
            error: error instanceof Error ? error.message : "Unknown error",
            status: finalStatus,
          }),
        });
      }
    });
  })
  .post(
    "/api/translation",
    zValidator("json", translationSchema),
    async (c) => {
      const body = await c.req.json<z.infer<typeof translationSchema>>();

      const sourceLanguageName = languageCodeToName[body.sourceLanguage];
      const targetLanguageName = languageCodeToName[body.targetLanguage];

      const result = await generateObject({
        model: ollama(body.model),
        schema: z.object({
          translatedText: z.string().describe("The translated text"),
        }),
        maxRetries: 3,
        temperature: 0.5,
        prompt: `Translate the following text from ${sourceLanguageName} to ${targetLanguageName} in ${body.tone} tone: ${body.sourceText}`,
      });

      const translation = await db.createTranslation({
        sourceText: body.sourceText,
        translatedText: result.object.translatedText,
        sourceLanguage: body.sourceLanguage,
        targetLanguage: body.targetLanguage,
        tone: body.tone,
        model: body.model,
      });

      return c.json({
        translationId: translation.id,
        translatedText: result.object.translatedText,
      });
    },
  );

export default app;
export type AppType = typeof app;
