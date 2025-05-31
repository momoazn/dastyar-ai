import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OllamaEmbeddings } from "@langchain/ollama";
import { Document } from "@langchain/core/documents";

export class VectorStoreManager {
  private embeddings: OllamaEmbeddings;
  private vectorStores: Map<string, MemoryVectorStore> = new Map();

  constructor() {
    this.embeddings = new OllamaEmbeddings({
      baseUrl: "http://localhost:11434",
      model: "nomic-embed-text",
    });
  }

  async getOrCreateVectorStore(threadId: string): Promise<MemoryVectorStore> {
    if (!this.vectorStores.has(threadId)) {
      const vectorStore = new MemoryVectorStore(this.embeddings);
      this.vectorStores.set(threadId, vectorStore);
    }
    return this.vectorStores.get(threadId)!;
  }

  async addDocuments(threadId: string, documents: Document[]): Promise<void> {
    const vectorStore = await this.getOrCreateVectorStore(threadId);
    await vectorStore.addDocuments(documents);
  }

  async similaritySearch(
    threadId: string,
    query: string,
    k: number = 4,
  ): Promise<Document[]> {
    const vectorStore = this.vectorStores.get(threadId);
    if (!vectorStore) {
      return [];
    }
    return await vectorStore.similaritySearch(query, k);
  }

  async removeDocuments(threadId: string, pdfId: string): Promise<void> {
    // For MemoryVectorStore, we need to recreate the store without the documents
    // This is a simplified implementation - in a production system you'd want
    // to track document metadata to selectively remove documents
    const vectorStore = this.vectorStores.get(threadId);
    if (vectorStore) {
      // For now, we'll clear the entire vector store for simplicity
      // In production, you'd want to implement selective document removal
      this.vectorStores.delete(threadId);
    }
  }

  clearVectorStore(threadId: string): void {
    this.vectorStores.delete(threadId);
  }
}
