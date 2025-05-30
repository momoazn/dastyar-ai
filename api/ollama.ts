import { Ollama } from "@langchain/ollama";
import { OllamaEmbeddings } from "@langchain/ollama";

export const ollamaLLM = new Ollama({
  model: "smollm2:1.7b",
  baseUrl: "http://localhost:11434",
});

export const ollamaEmbeddings = new OllamaEmbeddings({
  model: "nomic-embed-text",
  baseUrl: "http://localhost:11434",
});
