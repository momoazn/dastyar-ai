import { createOllama } from "ollama-ai-provider-v2";
import OpenAI from "openai";
import { env } from "@/config";
import { logger } from "@/lib/logger";

export const ollamaClient = new OpenAI({
  baseURL: `${env.OLLAMA_BASE_URL}/v1`,
  apiKey: "",
  timeout: 5000, // 5 second timeout
});

export const ollamaProvider = createOllama({
  baseURL: `${env.OLLAMA_BASE_URL}/api/`,
});

export async function listOllamaModels() {
  if (!env.OLLAMA_ENABLED) {
    return [];
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await ollamaClient.models.list({
      signal: controller.signal as AbortSignal,
    });
    clearTimeout(timeoutId);

    return response.data.map((model) => ({
      name: model.id,
      provider: "ollama" as const,
    }));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Connection failed";
    logger.error("Ollama provider not available", error, {
      baseURL: env.OLLAMA_BASE_URL,
      message,
    });
    return [];
  }
}
