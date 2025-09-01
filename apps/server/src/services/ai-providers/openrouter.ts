import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { env } from '../../env';

const OPENROUTER_API_KEY = env.OPENROUTER_API_KEY ?? '';
const ENABLE_OPENROUTER = env.OPENROUTER_ENABLED;

export const openrouterModels = [
  'openai/gpt-oss-20b:free',
  'z-ai/glm-4.5-air:free',
  'qwen/qwen3-coder:free',
  'moonshotai/kimi-k2:free',
  'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
  'google/gemma-3n-e2b-it:free',
  'tencent/hunyuan-a13b-instruct:free',
  'tngtech/deepseek-r1t2-chimera:free',
  'mistralai/mistral-small-3.2-24b-instruct:free',
  'moonshotai/kimi-dev-72b:free',
  'deepseek/deepseek-r1-0528-qwen3-8b:free',
  'deepseek/deepseek-r1-0528:free',
  'microsoft/mai-ds-r1:free',
  'qwen/qwen2.5-vl-32b-instruct:free',
];

export const openrouterProvider = createOpenRouter({
  apiKey: OPENROUTER_API_KEY,
});

export function listOpenrouterModels() {
  if (!(ENABLE_OPENROUTER && OPENROUTER_API_KEY)) {
    return [];
  }
  return openrouterModels.map((m) => ({
    name: m,
    provider: 'openrouter' as const,
  }));
}
