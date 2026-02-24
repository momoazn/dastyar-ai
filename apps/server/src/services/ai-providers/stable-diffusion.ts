/**
 * Stable Diffusion service - minimal API for image generation
 */

import { experimental_generateImage as generateImage } from "ai";
import {
  type Automatic1111Provider,
  createAutomatic1111,
} from "automatic1111-provider";

const MAX_RETRIES = 3;
const HEALTH_CACHE_MS = 5000;
const MODEL_ID_CACHE_MS = 60_000;
const STABLE_DIFFUSION_BASE_URL = "http://localhost:7860";

let provider: Automatic1111Provider | null = null;
let cachedHealth: { at: number; ok: boolean } | null = null;
let cachedModelId: { at: number; id: string } | null = null;

function getProvider(): Automatic1111Provider {
  if (!provider) {
    provider = createAutomatic1111({
      baseURL: STABLE_DIFFUSION_BASE_URL,
    });
  }
  return provider;
}

export type GenerateParams = {
  prompt: string;
  steps: number;
  cfgScale: number;
  negativePrompt?: string;
  sampler: string;
  width: number;
  height: number;
};

export type Progress = {
  progress: number;
  eta: number;
  state: {
    skipped: boolean;
    interrupted: boolean;
    job: string;
    jobCount: number;
    jobTimestamp: string;
    jobNo: number;
    samplingStep: number;
    samplingSteps: number;
  };
  currentImage?: string;
  textinfo?: string;
};

export async function ping(): Promise<boolean> {
  const now = Date.now();
  if (cachedHealth && now - cachedHealth.at < HEALTH_CACHE_MS) {
    return cachedHealth.ok;
  }

  try {
    const response = await fetch(`${STABLE_DIFFUSION_BASE_URL}/internal/ping`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    cachedHealth = { at: now, ok: response.ok };
    return response.ok;
  } catch {
    cachedHealth = { at: now, ok: false };
    return false;
  }
}

export async function getSamplers(): Promise<string[]> {
  const response = await fetch(
    `${STABLE_DIFFUSION_BASE_URL}/sdapi/v1/samplers`,
    {
      signal: AbortSignal.timeout(10_000),
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch samplers: HTTP ${response.status}`);
  }
  const samplers = await response.json();
  return samplers.map((s: { name: string }) => s.name);
}

async function getModelId(): Promise<string> {
  const now = Date.now();
  if (cachedModelId && now - cachedModelId.at < MODEL_ID_CACHE_MS) {
    return cachedModelId.id;
  }

  const response = await fetch(
    `${STABLE_DIFFUSION_BASE_URL}/sdapi/v1/options`,
    {
      signal: AbortSignal.timeout(10_000),
    }
  ).catch(() => null);

  if (response?.ok) {
    const options = (await response.json()) as {
      sd_model_checkpoint?: unknown;
    };
    const model = options.sd_model_checkpoint;
    if (typeof model === "string" && model.length > 0) {
      cachedModelId = { at: now, id: model };
      return model;
    }
  }
  const fallback = "v1-5-pruned-emaonly";
  cachedModelId = { at: now, id: fallback };
  return fallback;
}

export async function generate(params: GenerateParams): Promise<string> {
  const available = await ping();
  if (!available) {
    throw new Error("Stable Diffusion service is not available");
  }

  const modelId = await getModelId();
  const apiProvider = getProvider();
  const { images } = await generateImage({
    model: apiProvider.image(modelId),
    prompt: params.prompt,
    size: `${params.width}x${params.height}`,
    n: 1,
    maxRetries: MAX_RETRIES,
    abortSignal: AbortSignal.timeout(300_000),
    providerOptions: {
      automatic1111: {
        negative_prompt: params.negativePrompt || "",
        steps: params.steps,
        cfg_scale: params.cfgScale,
        sampler_name: params.sampler,
      },
    },
  });
  if (!images || images.length === 0) {
    throw new Error("No images generated");
  }
  return images[0].base64;
}

export async function progress(): Promise<Progress | null> {
  try {
    const response = await fetch(
      `${STABLE_DIFFUSION_BASE_URL}/sdapi/v1/progress`,
      {
        signal: AbortSignal.timeout(5000),
      }
    );
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch {
    return null;
  }
}

export async function interrupt(): Promise<boolean> {
  try {
    const response = await fetch(
      `${STABLE_DIFFUSION_BASE_URL}/sdapi/v1/interrupt`,
      {
        method: "POST",
        signal: AbortSignal.timeout(5000),
      }
    );
    return response.ok;
  } catch {
    return false;
  }
}
