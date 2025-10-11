import { createOllama } from 'ollama-ai-provider-v2';
import OpenAI from 'openai';
import { env } from '@/config';

export const ollamaClient = new OpenAI({
  baseURL: `${env.OLLAMA_BASE_URL}/v1`,
  apiKey: '',
});

export const ollamaProvider = createOllama({
  baseURL: `${env.OLLAMA_BASE_URL}/api/`,
});

export async function listOllamaModels() {
  if (!env.OLLAMA_ENABLED) {
    return [];
  }

  try {
    const response = await ollamaClient.models.list();
    return response.data.map((model) => ({
      name: model.id,
      provider: 'ollama' as const,
    }));
  } catch (error) {
    console.warn('Ollama server not available, skipping Ollama models:', error);
    return [];
  }
}
