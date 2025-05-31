import { Hono } from "hono";
import { cors } from "hono/cors";
import { stream } from "hono/streaming";
import { Ollama } from "ollama";

import { ChatService } from "./chat-service";
import { Database } from "./database";
import { PDFProcessor } from "./pdf";
import { MessagesStatusOptions } from "../src/lib/pocketbase-types";

const app = new Hono();
const pdfProcessor = new PDFProcessor();
const chatService = new ChatService();
const db = new Database();
const ollama = new Ollama({
  host: "http://localhost:11434",
});

// Middleware
app.use("*", cors());

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Upload PDF endpoint - updated for thread-based PDFs
app.post("/api/pdf/upload", async (c) => {
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

    // Create or get thread
    let currentThreadId = threadId;
    if (!currentThreadId) {
      const thread = await db.createThread(`PDF Upload - ${file.name}`);
      currentThreadId = thread.id;
    }

    // Create Persian upload message for the user
    const uploadMessage = await db.createMessage(
      currentThreadId,
      `فایل PDF "${file.name}" آپلود شد.`, // Persian: PDF file "{filename}" uploaded.
      "user",
      MessagesStatusOptions.finished,
    );

    // Save PDF record with thread reference
    const pdfRecord = await db.createPDF(
      currentThreadId,
      file.name,
      `/uploads/${file.name}`,
    );

    // Add documents to vector store for this thread
    await chatService.addPDFToThread(currentThreadId, documents);

    return c.json({
      success: true,
      pdfId: pdfRecord.id,
      threadId: currentThreadId,
      messageId: uploadMessage.id,
      filename: file.name,
      chunks: documents.length,
    });
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
});

// Delete PDF endpoint
app.delete("/api/pdf/:pdfId", async (c) => {
  try {
    const pdfId = c.req.param("pdfId");

    // Get PDF info before deletion
    const pdf = await db.getPDF(pdfId);
    if (!pdf) {
      return c.json({ error: "PDF not found" }, 404);
    }

    // Remove from vector store
    if (pdf.thread) {
      await chatService.removePDFFromThread(pdf.thread, pdfId);
    }

    // Remove from database
    await db.deletePDF(pdfId);

    return c.json({ success: true });
  } catch (error) {
    console.error("Delete PDF error:", error);
    return c.json(
      {
        error: "Failed to delete PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// Main chat endpoint - handles both regular and RAG chat with streaming
app.post("/api/chat", async (c) => {
  try {
    const body = (await c.req.json()) as {
      message: string;
      threadId: string;
      model: string;
    };

    if (!body.message || !body.threadId || !body.model) {
      return c.json({ error: "Message, threadId and model are required" }, 400);
    }

    // Create user message in PocketBase
    const userMessage = await db.createMessage(
      body.threadId,
      body.message,
      "user",
      MessagesStatusOptions.finished,
    );

    // Create assistant message placeholder
    const assistantMessage = await db.createMessage(
      body.threadId,
      "",
      "assistant",
      MessagesStatusOptions.reasoning,
    );

    // Check if thread has PDFs for RAG
    const threadPDFs = await db.getPDFsByThread(body.threadId);
    const hasDocuments = threadPDFs.length > 0;

    let finalMessage = body.message;
    let sources: Array<{ filename: string; chunk: number }> = [];

    // If thread has documents, enhance with RAG
    if (hasDocuments) {
      try {
        const ragResult = await chatService.getRelevantContext(
          body.threadId,
          body.message,
          threadPDFs.map((pdf) => pdf.id),
        );
        finalMessage = chatService.buildRAGPrompt(
          body.message,
          ragResult.context,
        );
        sources = ragResult.sources;
      } catch (error) {
        console.error("RAG enhancement error:", error);
        // Continue with original message if RAG fails
      }
    }

    // Stream response from Ollama using SDK and update PocketBase
    return stream(c, async (stream) => {
      try {
        let fullContent = "";
        let reasoning = "";
        let responseContent = "";
        let lastUpdateTime = Date.now();

        // Update message status to streaming
        await db.updateMessage(assistantMessage.id, {
          status: MessagesStatusOptions.streaming,
        });

        // Use Ollama SDK for streaming
        const response = await ollama.generate({
          model: body.model,
          prompt: finalMessage,
          stream: true,
        });

        // Iterate through the streaming response
        for await (const part of response) {
          if (part.response) {
            fullContent += part.response;

            // Parse reasoning and response content
            const { reasoning: newReasoning, response: newResponse } =
              parseReasoningTokens(fullContent);
            reasoning = newReasoning;
            responseContent = newResponse;

            // Send to frontend
            await stream.write(
              `data: ${JSON.stringify({
                type: "token",
                content: part.response,
                reasoning: newReasoning,
                response: newResponse,
                messageId: assistantMessage.id,
              })}\n\n`,
            );

            // Update PocketBase every 100ms
            const now = Date.now();
            if (now - lastUpdateTime >= 100) {
              await db.updateMessage(assistantMessage.id, {
                content: responseContent,
                reasoning: reasoning,
                status: MessagesStatusOptions.streaming,
              });
              lastUpdateTime = now;
            }
          }

          if (part.done) {
            // Final update with sources if RAG was used
            const finalContent =
              responseContent +
              (sources.length > 0
                ? `\n\n**منابع:** ${sources.map((s) => `${s.filename} (بخش ${s.chunk})`).join(", ")}`
                : "");

            await db.updateMessage(assistantMessage.id, {
              content: finalContent,
              reasoning: reasoning,
              status: MessagesStatusOptions.finished,
            });

            await stream.write(
              `data: ${JSON.stringify({
                type: "done",
                messageId: assistantMessage.id,
                sources: sources,
              })}\n\n`,
            );
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

        await stream.write(
          `data: ${JSON.stringify({
            type: "error",
            error: "Failed to generate response",
            messageId: assistantMessage.id,
          })}\n\n`,
        );
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
});

// Helper function to parse reasoning tokens
function parseReasoningTokens(content: string): {
  reasoning: string;
  response: string;
} {
  const REASONING_START_TAG = "<think>";
  const REASONING_END_TAG = "</think>";

  let reasoning = "";
  let response = "";

  const thinkStartIndex = content.indexOf(REASONING_START_TAG);

  if (thinkStartIndex !== -1) {
    const thinkEndIndex = content.indexOf(REASONING_END_TAG, thinkStartIndex);

    if (thinkEndIndex !== -1) {
      const reasoningStartPos = thinkStartIndex + REASONING_START_TAG.length;
      reasoning = content.substring(reasoningStartPos, thinkEndIndex).trim();

      const responseStartPos = thinkEndIndex + REASONING_END_TAG.length;
      response = content.substring(responseStartPos).trim();
    } else {
      const reasoningStartPos = thinkStartIndex + REASONING_START_TAG.length;
      reasoning = content.substring(reasoningStartPos).trim();
      response = "";
    }
  } else {
    response = content;
  }

  return { reasoning, response };
}

export default app;
