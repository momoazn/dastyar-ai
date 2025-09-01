import { Ollama } from 'ollama';
import { createOllama } from 'ollama-ai-provider-v2';
import { env } from '../../env';

const OLLAMA_BASE_URL = env.OLLAMA_BASE_URL;

export const ollamaClient = new Ollama({
  host: OLLAMA_BASE_URL,
});

export const ollamaProvider = createOllama({
  baseURL: OLLAMA_BASE_URL,
});

export async function listOllamaModels() {
  const response = await ollamaClient.list();
  return response.models.map((model) => ({
    name: model.model,
    provider: 'ollama' as const,
  }));
}
