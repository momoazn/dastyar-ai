import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import OpenAI from 'openai';
import { env } from '../../env';

const LMSTUDIO_OPENAI_BASE_URL = env.LMSTUDIO_BASE_URL;
const LMSTUDIO_ENABLED = env.LMSTUDIO_ENABLED;

export const lmstudioClient = new OpenAI({
  baseURL: LMSTUDIO_OPENAI_BASE_URL,
  apiKey: env.LMSTUDIO_API_KEY,
});

export const lmstudioProvider = createOpenAICompatible({
  baseURL: LMSTUDIO_OPENAI_BASE_URL,
  name: 'lmstudio',
  apiKey: env.LMSTUDIO_API_KEY,
});

export async function listLmstudioModels() {
  if (!LMSTUDIO_ENABLED) {
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
