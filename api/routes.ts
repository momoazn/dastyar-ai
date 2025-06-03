import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { streamSSE } from "hono/streaming";
import { ollama } from "ollama-ai-provider";
import { z } from "zod";

import { streamText } from "ai";
import {
  MessagesRoleOptions,
  MessagesStatusOptions,
} from "../src/lib/pocketbase-types";
import { ChatService } from "./chat-service";
import { Database } from "./database";
import { PDFProcessor } from "./pdf";
import { convertToCoreMessages, parseReasoningTokens } from "./utils";

const pdfProcessor = new PDFProcessor();
const chatService = new ChatService();
const db = new Database();

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
        last_message_at: new Date().toISOString(),
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

            console.log(">>>>>>>>>>>> Aborted", stream.aborted);
            console.log(">>>>>>>>>>>> Closed", stream.closed);

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
    },
  );

export default app;
export type AppType = typeof app;
