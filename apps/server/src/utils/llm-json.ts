// Utilities to robustly extract compact JSON objects from LLM outputs
import { z } from "zod";

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
    .replace(THINK_BLOCK, "")
    .replace(FENCED_JSON_OPEN, "")
    .replace(FENCED_OPEN, "")
    .replace(FENCED_CLOSE, "");

  const candidates = cleaned.match(JSON_OBJECT_REGEX) ?? [];
  for (let i = candidates.length - 1; i >= 0; i -= 1) {
    const candidate = candidates[i];
    try {
      const parsed = JSON.parse(candidate) as Record<string, unknown>;
      if (
        parsed &&
        typeof parsed === "object" &&
        Object.hasOwn(parsed, fieldName)
      ) {
        const v = parsed[fieldName];
        return v == null ? "" : String(v);
      }
    } catch {
      // ignore and continue
    }
  }
  return null;
}

/**
 * Extracts a complete JSON object from LLM output and validates it against a Zod schema
 * @param rawOutput - The raw LLM output text
 * @param schema - Zod schema to validate against
 * @returns Parsed and validated object or null if extraction/validation fails
 */
export function extractJsonObject<T>(
  rawOutput: string,
  schema: z.ZodSchema<T>
): T | null {
  const cleaned = rawOutput
    .trim()
    .replace(THINK_BLOCK, "")
    .replace(FENCED_JSON_OPEN, "")
    .replace(FENCED_OPEN, "")
    .replace(FENCED_CLOSE, "");

  const candidates = cleaned.match(JSON_OBJECT_REGEX) ?? [];
  for (let i = candidates.length - 1; i >= 0; i -= 1) {
    const candidate = candidates[i];
    try {
      const parsed = JSON.parse(candidate);
      const validated = schema.parse(parsed);
      return validated;
    } catch {
      // ignore and continue to next candidate
    }
  }
  return null;
}

/**
 * Gets the first field name from a Zod object schema
 * @param schema - Zod object schema
 * @returns First field name or null if not an object schema
 */
export function getFirstFieldName(schema: z.ZodSchema): string | null {
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    const keys = Object.keys(shape);
    return keys.length > 0 ? keys[0] : null;
  }
  return null;
}
