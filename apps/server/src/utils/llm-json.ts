// Utilities to robustly extract compact JSON objects from LLM outputs

const FENCED_JSON_OPEN = /^```json\s*/i;
const FENCED_OPEN = /^```\s*/i;
const FENCED_CLOSE = /```\s*$/i;
const THINK_BLOCK = /<think>[\s\S]*?<\/think>/gi;
const JSON_OBJECT_REGEX = /\{[\s\S]*?\}/g;

export function extractJsonField(
  rawOutput: string,
  fieldName: string
): string | null {
  const cleaned = rawOutput
    .trim()
    .replace(THINK_BLOCK, '')
    .replace(FENCED_JSON_OPEN, '')
    .replace(FENCED_OPEN, '')
    .replace(FENCED_CLOSE, '');

  const candidates = cleaned.match(JSON_OBJECT_REGEX) ?? [];
  for (let i = candidates.length - 1; i >= 0; i -= 1) {
    const candidate = candidates[i];
    try {
      const parsed = JSON.parse(candidate) as Record<string, unknown>;
      if (
        parsed &&
        typeof parsed === 'object' &&
        Object.hasOwn(parsed, fieldName)
      ) {
        const v = parsed[fieldName];
        return v == null ? '' : String(v);
      }
    } catch {
      // ignore and continue
    }
  }
  return null;
}
