import type { UIMessage } from 'ai';
import type OpenAI from 'openai';
import type { ModelProvider } from '@/db/schema';
import { generateId } from './ids';

export function extractTextFromParts(message: UIMessage): {
  content: string;
  reasoning: string | null;
} {
  const textParts: string[] = [];
  const reasoningParts: string[] = [];
  for (const part of message.parts) {
    if (part.type === 'text') {
      textParts.push(part.text);
    } else if (part.type === 'reasoning') {
      reasoningParts.push(part.text);
    }
  }
  const content = textParts.join('\n').trim();
  const reasoningJoined = reasoningParts.join('\n').trim();
  return {
    content,
    reasoning: reasoningJoined.length > 0 ? reasoningJoined : null,
  };
}

export function convertOpenAICompatibleModelsToDbModel(
  providerModels: Partial<Record<ModelProvider, OpenAI.Models.Model[]>>
) {
  return Object.values(providerModels)
    .flat()
    .map((model) => ({
      id: generateId(),
      name: model.id,
      provider: model.provider,
    }));
}
