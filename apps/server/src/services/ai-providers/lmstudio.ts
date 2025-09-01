import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import OpenAI from 'openai';
import { getAiProviderApiKey, getAiProviderBaseUrl } from '@/config';

const LMSTUDIO_OPENAI_BASE_URL =
  getAiProviderBaseUrl('lmstudio') ?? 'http://localhost:1234/v1';

export const lmstudioClient = new OpenAI({
  baseURL: LMSTUDIO_OPENAI_BASE_URL,
  apiKey: getAiProviderApiKey('lmstudio') ?? 'lmstudio',
});

export const lmstudioProvider = createOpenAICompatible({
  baseURL: LMSTUDIO_OPENAI_BASE_URL,
  name: 'lmstudio',
  apiKey: getAiProviderApiKey('lmstudio') ?? 'lmstudio',
});

export async function listLmstudioModels() {
  const response = await lmstudioClient.models.list();
  return response.data.map((model) => ({
    name: model.id,
    provider: 'lmstudio' as const,
  }));
}
