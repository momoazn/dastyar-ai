import { createGroq } from '@ai-sdk/groq';
import { config } from '@/config';

const GROQ_API_KEY = config.GROQ_API_KEY;
const ENABLE_GROQ = config.GROQ_ENABLED;

export const groqModels = [
  'gemma2-9b-it',
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
  'meta-llama/llama-guard-4-12b',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'deepseek-r1-distill-llama-70b',
  'meta-llama/llama-4-maverick-17b-128e-instruct',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'meta-llama/llama-prompt-guard-2-22m',
  'meta-llama/llama-prompt-guard-2-86m',
  'mistral-saba-24b',
  'moonshotai/kimi-k2-instruct',
  'qwen/qwen3-32b',
  'llama-guard-3-8b',
  'llama3-70b-8192',
  'llama3-8b-8192',
  'mixtral-8x7b-32768',
  'qwen-qwq-32b',
  'qwen-2.5-32b',
  'deepseek-r1-distill-qwen-32b',
];

export const groqProvider = createGroq({ apiKey: GROQ_API_KEY });

export function listGroqModels() {
  if (!(ENABLE_GROQ && GROQ_API_KEY)) {
    return [];
  }
  return groqModels.map((m) => ({ name: m, provider: 'groq' as const }));
}
