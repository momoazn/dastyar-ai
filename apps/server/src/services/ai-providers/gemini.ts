import { createGoogleGenerativeAI } from '@ai-sdk/google';
import {
  getAiProviderApiKey,
  getAiProviderBaseUrl,
  isAiProviderEnabled,
} from '@/config';

const GEMINI_API_KEY = getAiProviderApiKey('gemini') ?? '';
const GEMINI_BASE_URL =
  getAiProviderBaseUrl('gemini') ??
  'https://generativelanguage.googleapis.com/v1beta/openai/';
const ENABLE_GEMINI = isAiProviderEnabled('gemini');

export const geminiModels = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-001',
  'gemini-2.0-flash-lite',
  'gemini-2.0-pro-exp-02-05',
  'gemini-2.0-flash-thinking-exp-01-21',
  'gemini-2.0-flash-exp',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-pro-exp-03-25',
  'gemini-2.5-flash-preview-04-17',
  'gemma-3-12b-it',
  'gemma-3-27b-it',
];

export const geminiProvider = createGoogleGenerativeAI({
  apiKey: GEMINI_API_KEY,
  baseURL: GEMINI_BASE_URL,
});

export function listGeminiModels() {
  if (!(ENABLE_GEMINI && GEMINI_API_KEY)) {
    return [];
  }
  return geminiModels.map((m) => ({ name: m, provider: 'gemini' as const }));
}
