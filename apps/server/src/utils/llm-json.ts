// Utilities to robustly extract compact JSON objects from LLM outputs
import { z } from "zod";

const FENCED_JSON_OPEN = /^```json\s*/i;
const FENCED_OPEN = /^```\s*/i;
const FENCED_CLOSE = /```\s*$/i;
const THINK_BLOCK = /<think>[\s\S]*?<\/think>/gi;
function stepStringState(
  char: string,
  escaped: boolean
): { escaped: boolean; stillInString: boolean } {
  if (escaped) {
    return { escaped: false, stillInString: true };
  }
  if (char === "\\") {
    return { escaped: true, stillInString: true };
  }
  if (char === '"') {
    return { escaped: false, stillInString: false };
  }
  return { escaped: false, stillInString: true };
}

function extractJsonObjectCandidates(input: string): string[] {
  const candidates: string[] = [];
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];

    if (inString) {
      const next = stepStringState(char, escaped);
      escaped = next.escaped;
      inString = next.stillInString;
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      if (depth === 0) start = i;
      depth += 1;
    } else if (char === "}" && depth > 0) {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        candidates.push(input.slice(start, i + 1));
        start = -1;
      }
    }
  }

  return candidates;
}

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

  const candidates = extractJsonObjectCandidates(cleaned);
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

  const candidates = extractJsonObjectCandidates(cleaned);
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
