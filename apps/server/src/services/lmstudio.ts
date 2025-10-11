import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import OpenAI from 'openai';
import { env } from '@/config';

export const lmstudioClient = new OpenAI({
  baseURL: env.LMSTUDIO_BASE_URL,
  apiKey: '',
});

export const lmstudioProvider = createOpenAICompatible({
  baseURL: env.LMSTUDIO_BASE_URL,
  name: 'lmstudio',
});

export async function listLmstudioModels() {
  if (!env.LMSTUDIO_ENABLED) {
    return [];
  }

  try {
    const response = await lmstudioClient.models.list();
    return response.data.map((model) => ({
      name: model.id,
      provider: 'lmstudio' as const,
    }));
  } catch (error) {
    console.warn(
      'LMStudio server not available, skipping LMStudio models:',
      error
    );
    return [];
  }
}
