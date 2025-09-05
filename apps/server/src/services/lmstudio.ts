import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import OpenAI from 'openai';
import { config } from '@/config';

const LMSTUDIO_OPENAI_BASE_URL = config.LMSTUDIO_BASE_URL;
const LMSTUDIO_ENABLED = config.LMSTUDIO_ENABLED;

export const lmstudioClient = new OpenAI({
  baseURL: LMSTUDIO_OPENAI_BASE_URL,
  apiKey: '',
});

export const lmstudioProvider = createOpenAICompatible({
  baseURL: LMSTUDIO_OPENAI_BASE_URL,
  name: 'lmstudio',
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
