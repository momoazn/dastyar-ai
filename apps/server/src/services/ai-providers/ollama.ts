import { createOllama } from 'ollama-ai-provider-v2';
import OpenAI from 'openai';
import { env } from '../../env';

const OLLAMA_BASE_URL = env.OLLAMA_BASE_URL;
const OLLAMA_ENABLED = env.OLLAMA_ENABLED;

export const ollamaClient = new OpenAI({
  baseURL: OLLAMA_BASE_URL,
  apiKey: env.OLLAMA_API_KEY,
});

export const ollamaProvider = createOllama({
  baseURL: OLLAMA_BASE_URL,
});

export async function listOllamaModels() {
  if (!OLLAMA_ENABLED) {
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
