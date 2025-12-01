import type { GenerationSettings } from "@/server/procedures/images";

const _TRAILING_SLASH_RE = /\/$/;

/**
 * Parse a size value string into width and height
 */
export function parseSizeValue(value: string): {
  width: number;
  height: number;
} {
  if (value.includes("x")) {
    const [width, height] = value.split("x").map(Number);
    return { width, height };
  }
  const size = Number(value);
  return { width: size, height: size };
}

/**
 * Format width and height into a size value string
 */
export function formatSizeValue(width: number, height: number): string {
  if (width === height) {
    return width.toString();
  }
  return `${width}x${height}`;
}

/**
 * Builds a complete image source URL with authentication token
 */
export function buildSrc(url: string, token: string | null): string {
  // Use URL as-is (relative URLs work since frontend and API are same origin)
  // If URL is already absolute (starts with http), it will be used as-is
  const finalUrl = url;
  return token ? `${finalUrl}?token=${encodeURIComponent(token)}` : finalUrl;
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

/**
 * Parse search parameters into settings and initial prompt
 */
export function parseSearchParams(search: Record<string, unknown>): {
  settings: Partial<GenerationSettings>;
  initialPrompt: string | null;
} {
  const settings: Partial<GenerationSettings> = {};

  // Parse width
  if (typeof search.width === "string") {
    const width = Number(search.width);
    if (!Number.isNaN(width)) settings.width = width;
  } else if (typeof search.width === "number") {
    settings.width = search.width;
  }

  // Parse height
  if (typeof search.height === "string") {
    const height = Number(search.height);
    if (!Number.isNaN(height)) settings.height = height;
  } else if (typeof search.height === "number") {
    settings.height = search.height;
  }

  // Parse steps
  if (typeof search.steps === "string") {
    const steps = Number(search.steps);
    if (!Number.isNaN(steps)) settings.steps = steps;
  } else if (typeof search.steps === "number") {
    settings.steps = search.steps;
  }

  // Parse cfgScale
  if (typeof search.cfgScale === "string") {
    const cfgScale = Number(search.cfgScale);
    if (!Number.isNaN(cfgScale)) settings.cfgScale = cfgScale;
  } else if (typeof search.cfgScale === "number") {
    settings.cfgScale = search.cfgScale;
  }

  // Parse sampler
  if (typeof search.sampler === "string") {
    settings.sampler = search.sampler;
  }

  // Parse negativePrompt
  if (typeof search.negativePrompt === "string") {
    settings.negativePrompt = search.negativePrompt;
  }

  // Parse initialPrompt
  const initialPrompt =
    typeof search.initialPrompt === "string" ? search.initialPrompt : null;

  return { settings, initialPrompt };
}
