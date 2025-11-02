import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import OpenAI from "openai";
import { env } from "@/config";
import { logger } from "@/lib/logger";

export const lmstudioClient = new OpenAI({
  baseURL: env.LMSTUDIO_BASE_URL,
  apiKey: "",
  timeout: 5000, // 5 second timeout
});

export const lmstudioProvider = createOpenAICompatible({
  baseURL: env.LMSTUDIO_BASE_URL,
  name: "lmstudio",
});

export async function listLmstudioModels() {
  if (!env.LMSTUDIO_ENABLED) {
    return [];
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await lmstudioClient.models.list({
      signal: controller.signal as AbortSignal,
    });
    clearTimeout(timeoutId);

    return response.data.map((model) => ({
      name: model.id,
      provider: "lmstudio" as const,
    }));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Connection failed";
    logger.error("LMStudio provider not available", error, {
      baseURL: env.LMSTUDIO_BASE_URL,
      message,
    });
    return [];
  }
}
