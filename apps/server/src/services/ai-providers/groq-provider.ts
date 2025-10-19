import { createGroq } from "@ai-sdk/groq";
import { env } from "@/config";

export const groqProvider = createGroq({
  apiKey: env.GROQ_API_KEY,
});

export function listGroqModels() {
  if (!(env.GROQ_ENABLED && env.GROQ_API_KEY)) {
    return [];
  }

  try {
    // Return static list of popular Groq models
    return [
      { name: "gemma2-9b-it", provider: "groq" as const },
      { name: "llama-3.1-70b-versatile", provider: "groq" as const },
      { name: "qwen/qwq-32b", provider: "groq" as const },
      { name: "mixtral-8x7b-32768", provider: "groq" as const },
      { name: "llama-3.1-8b-instant", provider: "groq" as const },
      { name: "llama-3.1-70b-instruct", provider: "groq" as const },
      { name: "gemma2-27b-it", provider: "groq" as const },
      { name: "llama-3.2-90b-vision-instruct", provider: "groq" as const },
    ];
  } catch (error) {
    console.warn("Groq not available, skipping Groq models:", error);
    return [];
  }
}
