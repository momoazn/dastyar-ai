import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { env } from "@/config";

export const openrouterProvider = createOpenRouter({
  apiKey: env.OPENROUTER_API_KEY,
});

export function listOpenRouterModels() {
  if (!(env.OPENROUTER_ENABLED && env.OPENROUTER_API_KEY)) {
    return [];
  }

  try {
    // Return static list of popular OpenRouter models
    return [
      { name: "anthropic/claude-3.5-sonnet", provider: "openrouter" as const },
      {
        name: "meta-llama/llama-3.1-405b-instruct",
        provider: "openrouter" as const,
      },
      { name: "openai/gpt-4-turbo", provider: "openrouter" as const },
      { name: "anthropic/claude-3-haiku", provider: "openrouter" as const },
      {
        name: "meta-llama/llama-3.1-70b-instruct",
        provider: "openrouter" as const,
      },
      { name: "openai/gpt-4o", provider: "openrouter" as const },
    ];
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Connection failed";
    console.warn(`[OpenRouter] Not available: ${message}`);
    return [];
  }
}
