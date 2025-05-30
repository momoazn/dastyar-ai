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

  clearVectorStore(threadId: string): void {
    this.vectorStores.delete(threadId);
  }
}
