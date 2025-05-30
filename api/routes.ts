import { Hono } from "hono";
import { cors } from "hono/cors";
import { ChatService } from "./chat-service";
import { Database } from "./database";
import { PDFProcessor } from "./pdf";

const app = new Hono();
const pdfProcessor = new PDFProcessor();
const chatService = new ChatService();
const db = new Database();

// Middleware
app.use("*", cors());

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Upload PDF endpoint
app.post("/api/upload", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    const threadId = formData.get("threadId") as string;

    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }

    if (file.type !== "application/pdf") {
      return c.json({ error: "Only PDF files are allowed" }, 400);
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Process PDF
    const documents = await pdfProcessor.processPDF(buffer, file.name);

    // Create or get thread
    let currentThreadId = threadId;
    if (!currentThreadId) {
      const thread = await db.createThread(`PDF Upload - ${file.name}`);
      currentThreadId = thread.id;
    }

    // Create message for the PDF upload
    const uploadMessage = await db.createMessage(
      currentThreadId,
      `Uploaded PDF: ${file.name}`,
      "user",
    );

    // Save PDF record
    await db.createPDF(uploadMessage.id, file.name, `/uploads/${file.name}`);

    // Add documents to vector store
    await chatService.addPDFToThread(currentThreadId, documents);

    return c.json({
      success: true,
      threadId: currentThreadId,
      messageId: uploadMessage.id,
      filename: file.name,
      chunks: documents.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return c.json(
      {
        error: "Failed to process PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// Chat endpoint - modified to work with your existing flow
app.post("/api/chat", async (c) => {
  try {
    const body = (await c.req.json()) as {
      message: string;
      threadId: string;
    };

    if (!body.message) {
      return c.json({ error: "Message is required" }, 400);
    }

    if (!body.threadId) {
      return c.json({ error: "Thread ID is required for RAG chat" }, 400);
    }

    // Get relevant context from uploaded PDFs
    const { context, sources } = await chatService.getRelevantContext(
      body.threadId,
      body.message,
    );

    // Build enhanced prompt for your frontend to use with Ollama
    const enhancedPrompt = chatService.buildRAGPrompt(body.message, context);

    // Check if thread has any documents
    const hasDocuments = await chatService.hasDocuments(body.threadId);

    return c.json({
      enhancedPrompt,
      originalMessage: body.message,
      context,
      sources,
      hasDocuments,
      threadId: body.threadId,
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

// New endpoint to check if a thread has uploaded documents
app.get("/api/threads/:threadId/has-documents", async (c) => {
  try {
    const threadId = c.req.param("threadId");
    const hasDocuments = await chatService.hasDocuments(threadId);
    const pdfs = await db.getPDFsByThread(threadId);

    return c.json({
      hasDocuments,
      documentCount: pdfs.length,
      documents: pdfs.map((pdf) => ({ id: pdf.id, filename: pdf.filename })),
    });
  } catch (error) {
    console.error("Check documents error:", error);
    return c.json(
      {
        error: "Failed to check documents",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// Get thread messages
app.get("/api/threads/:threadId/messages", async (c) => {
  try {
    const threadId = c.req.param("threadId");
    const messages = await db.getMessages(threadId);

    return c.json({ messages });
  } catch (error) {
    console.error("Get messages error:", error);
    return c.json(
      {
        error: "Failed to fetch messages",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// Get thread info
app.get("/api/threads/:threadId", async (c) => {
  try {
    const threadId = c.req.param("threadId");
    const thread = await db.getThread(threadId);

    if (!thread) {
      return c.json({ error: "Thread not found" }, 404);
    }

    const pdfs = await db.getPDFsByThread(threadId);

    return c.json({ thread, pdfs });
  } catch (error) {
    console.error("Get thread error:", error);
    return c.json(
      {
        error: "Failed to fetch thread",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

export default app;
