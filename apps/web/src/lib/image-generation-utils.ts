import type { GenerationSettings } from "@/server/procedures/images";

const TRAILING_SLASH_RE = /\/$/;

/**
 * Builds a complete image source URL with authentication token
 */
export function buildSrc(url: string, token: string | null): string {
  const server = (import.meta.env.VITE_SERVER_URL || "").replace(
    TRAILING_SLASH_RE,
    ""
  );
  const absolute = url.startsWith("http") ? url : `${server}${url}`;
  return token ? `${absolute}?token=${encodeURIComponent(token)}` : absolute;
}

/**
 * Merges partial settings with default settings
 */
export function getMergedSettings(
  raw: Partial<GenerationSettings>,
  defaults: GenerationSettings
): GenerationSettings {
  return {
    width: typeof raw.width === "number" ? raw.width : defaults.width,
    height: typeof raw.height === "number" ? raw.height : defaults.height,
    sampler: typeof raw.sampler === "string" ? raw.sampler : defaults.sampler,
    steps: typeof raw.steps === "number" ? raw.steps : defaults.steps,
    cfgScale:
      typeof raw.cfgScale === "number" ? raw.cfgScale : defaults.cfgScale,
    negativePrompt:
      typeof raw.negativePrompt === "string"
        ? raw.negativePrompt
        : defaults.negativePrompt,
  };
}
