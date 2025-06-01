import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { streamSSE } from "hono/streaming";
import { Ollama } from "ollama";
import { z } from "zod";

import {
  MessagesRoleOptions,
  MessagesStatusOptions,
} from "../src/lib/pocketbase-types";
import { ChatService } from "./chat-service";
import { Database } from "./database";
import { PDFProcessor } from "./pdf";
import { convertToOllamaMessages, parseReasoningTokens } from "./utils";

const pdfProcessor = new PDFProcessor();
const chatService = new ChatService();
const db = new Database();
const ollama = new Ollama({
  host: "http://localhost:11434",
});

const app = new Hono()
  .use("*", cors())
  .get("/health", (c) => {
    return c.json({ status: "ok", timestamp: new Date().toISOString() }, 200);
  })
  .post(
    "/api/pdf/upload",
    zValidator(
      "form",
      z.object({
        pdf: z.instanceof(File),
        threadId: z.string(),
      }),
    ),
    async (c) => {
      try {
        const formData = await c.req.formData();
        const file = formData.get("pdf") as File;
        const threadId = formData.get("threadId") as string;

        if (!file) {
          return c.json({ error: "No file provided" }, 400);
        }

        if (file.type !== "application/pdf") {
          return c.json({ error: "Only PDF files are allowed" }, 400);
        }

        // Convert file to buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // Process PDF and get documents
        const documents = await pdfProcessor.processPDF(buffer, file.name);

        // Create Persian upload message for the user
        const uploadMessage = await db.createMessage({
          threadId,
          content: `فایل PDF "${file.name}" آپلود شد.`,
          role: MessagesRoleOptions.user,
          status: MessagesStatusOptions.finished,
          model: "",
        });

        // Save PDF record with thread reference
        const pdfRecord = await db.createPDF(
          threadId,
          file.name,
          `/uploads/${file.name}`,
        );

        // Add documents to vector store for this thread
        await chatService.addPDFToThread(threadId, documents);

        return c.json(
          {
            success: true,
            pdfId: pdfRecord.id,
            threadId,
            messageId: uploadMessage.id,
            filename: file.name,
            chunks: documents.length,
          },
          200,
        );
      } catch (error) {
        console.error("Upload error:", error);
        return c.json(
          {
            success: false,
            error: "Failed to process PDF",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          500,
        );
      }
    },
  )
  .post(
    "/api/chat",
    zValidator(
      "json",
      z.object({
        message: z.string(),
        threadId: z.string(),
        model: z.string(),
      }),
    ),
    async (c) => {
      try {
        const body = (await c.req.json()) as {
          message: string;
          threadId: string;
          model: string;
        };

        if (!body.message || !body.threadId || !body.model) {
          return c.json(
            { error: "Message, threadId and model are required" },
            400,
          );
        }

        const messages = await db.getMessages(body.threadId);
        const messagesToSend = convertToOllamaMessages(messages);
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
          last_message_at: new Date().toISOString(),
        });

        // Stream response from Ollama using SDK and update PocketBase
        return streamSSE(c, async (stream) => {
          try {
            let fullContent = "";
            let reasoningContent = "";
            let responseContent = "";
            let lastUpdateTime = Date.now();

            // Update message status to streaming
            await db.updateMessage(assistantMessage.id, {
              status: MessagesStatusOptions.reasoning,
            });

            // Use Ollama SDK for streaming
            const response = await ollama.chat({
              model: body.model,
              messages: messagesToSend,
              stream: true,
            });

            // Iterate through the streaming response
            for await (const part of response) {
              if (part.message) {
                fullContent += part.message.content;

                // Parse reasoning and response content
                const {
                  reasoning: newReasoning,
                  response: newResponse,
                  isReasoning,
                } = parseReasoningTokens(fullContent);

                reasoningContent = newReasoning;
                responseContent = newResponse;

                await stream.writeSSE({
                  data: JSON.stringify({
                    status: isReasoning
                      ? MessagesStatusOptions.reasoning
                      : MessagesStatusOptions.streaming,
                    reasoning: reasoningContent,
                    response: responseContent,
                    fullContent,
                  }),
                  event: "message",
                  id: assistantMessage.id,
                  retry: 1000,
                });

                // Update PocketBase every 100ms
                const now = Date.now();
                if (now - lastUpdateTime >= 100) {
                  await db.updateMessage(assistantMessage.id, {
                    reasoning: reasoningContent,
                    content: responseContent,
                    status: isReasoning
                      ? MessagesStatusOptions.reasoning
                      : MessagesStatusOptions.streaming,
                  });
                  lastUpdateTime = now;
                }

                if (stream.aborted) {
                  console.log("@@@@ stream.aborted");
                  await db.updateMessage(assistantMessage.id, {
                    status: MessagesStatusOptions.stopped,
                  });
                  break;
                }
              }

              if (part.done) {
                await db.updateMessage(assistantMessage.id, {
                  content: responseContent,
                  reasoning: reasoningContent,
                  status: MessagesStatusOptions.finished,
                });

                await stream.writeSSE({
                  data: JSON.stringify({
                    status: MessagesStatusOptions.finished,
                  }),
                  event: "message",
                  id: assistantMessage.id,
                  retry: 1000,
                });
                break;
              }
            }
          } catch (error) {
            console.error("Streaming error:", error);

            // Update message with error status
            await db.updateMessage(assistantMessage.id, {
              content: "متأسفم، خطایی در تولید پاسخ رخ داد.", // Persian: Sorry, an error occurred while generating the response.
              status: MessagesStatusOptions.errored,
            });

            await stream.writeSSE({
              data: JSON.stringify({
                status: MessagesStatusOptions.errored,
              }),
              event: "message",
              id: assistantMessage.id,
              retry: 1000,
            });
          }
        });
      } catch (error) {
        console.error("Chat error:", error);
        return c.json(
          {
            error: "Failed to process chat message",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          500,
        );
      }
    },
  );

export default app;
export type AppType = typeof app;
