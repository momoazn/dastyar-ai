import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { env } from "@/config";

export const geminiProvider = createGoogleGenerativeAI({
  apiKey: env.GEMINI_API_KEY,
});

export function listGeminiModels() {
  if (!(env.GEMINI_ENABLED && env.GEMINI_API_KEY)) {
    return [];
  }

  try {
    // Return static list of popular Gemini models
    return [
      { name: "gemini-2.5-flash", provider: "gemini" as const },
      { name: "gemini-2.5-pro", provider: "gemini" as const },
    ];
  } catch (error) {
    console.warn("Gemini not available, skipping Gemini models:", error);
    return [];
  }
}
