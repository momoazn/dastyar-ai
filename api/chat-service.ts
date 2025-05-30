import { Document } from "@langchain/core/documents";
import { VectorStoreManager } from "./vector-store";
import { Database } from "./database";

export class ChatService {
  private vectorManager: VectorStoreManager;
  private db: Database;

  constructor() {
    this.vectorManager = new VectorStoreManager();
    this.db = new Database();
  }

  // Instead of generating responses, just provide context for your frontend
  async getRelevantContext(
    threadId: string,
    message: string,
  ): Promise<{
    context: string;
    sources: { filename: string; chunk: number }[];
  }> {
    const relevantDocs = await this.vectorManager.similaritySearch(
      threadId,
      message,
      4,
    );

    const context = relevantDocs.map((doc) => doc.pageContent).join("\n\n");
    const sources = relevantDocs.map((doc) => ({
      filename: doc.metadata.source || "unknown",
      chunk: doc.metadata.chunk || 0,
    }));

    return { context, sources };
  }

  // Enhanced prompt that your frontend can use with Ollama
  buildRAGPrompt(userMessage: string, context: string): string {
    if (!context.trim()) {
      return userMessage;
    }

    return `Use the following context from uploaded documents to help answer the question. If the context doesn't contain relevant information, you can still provide a general response, but mention that you don't have specific information from the uploaded documents.

Context from documents:
${context}

Question: ${userMessage}

Answer:`;
  }

  async addPDFToThread(threadId: string, documents: Document[]): Promise<void> {
    await this.vectorManager.addDocuments(threadId, documents);
  }

  async hasDocuments(threadId: string): Promise<boolean> {
    const docs = await this.vectorManager.similaritySearch(threadId, "test", 1);
    return docs.length > 0;
  }
}
