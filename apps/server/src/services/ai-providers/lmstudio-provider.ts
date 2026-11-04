import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import OpenAI from "openai";
import { logger } from "@/lib/logger";

const LMSTUDIO_BASE_URL = "http://localhost:1234/v1";
// Automatic model discovery is off: when LM Studio is not running, every
// model listing would log a connection error. Admins can still add LM Studio
// models by hand in the admin panel. Set to true to list them automatically.
const LMSTUDIO_ENABLED = false;

export const lmstudioClient = new OpenAI({
  baseURL: LMSTUDIO_BASE_URL,
  apiKey: "",
  timeout: 5000, // 5 second timeout
});

export const lmstudioProvider = createOpenAICompatible({
  baseURL: LMSTUDIO_BASE_URL,
  name: "lmstudio",
});

export async function listLmstudioModels() {
  if (!LMSTUDIO_ENABLED) {
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
      baseURL: LMSTUDIO_BASE_URL,
      message,
    });
    return [];
  }
}
