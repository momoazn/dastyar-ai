import type { LanguageCode, ToneOption } from '@/components/translation/types';
import { client, orpc } from '@/utils/orpc';

export interface TranslateParams {
  text: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  tone?: ToneOption;
  model?: string;
  provider?:
    | 'ollama'
    | 'lmstudio'
    | 'openai'
    | 'anthropic'
    | 'gemini'
    | 'mistral'
    | 'openrouter'
    | 'requesty';
}

export interface ModelOption {
  model: string;
  name?: string;
}

// Wrap API calls behind a small service for easier testing and future changes
export async function translateText(
  params: TranslateParams
): Promise<{ id: string | null; translatedText: string | null }> {
  // The client throws on error; callers should handle
  const result = await client.translations.translate(params);
  return result;
}

export const modelsQueryOptions = () => orpc.models.list.queryOptions();

export type ModelsListResult = Awaited<ReturnType<typeof client.models.list>>;
