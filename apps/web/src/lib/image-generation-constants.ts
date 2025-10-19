import type { GenerationSettings } from "@/server/procedures/images";

export const DEFAULT_NEGATIVE_PROMPT =
  "blurry, low quality, distorted, deformed, extra limbs, bad anatomy, text, watermark, logo, grainy, out of frame, ugly, poorly drawn, unnatural lighting";

export const DEFAULT_SETTINGS: GenerationSettings = {
  steps: 20,
  cfgScale: 7.5,
  negativePrompt: DEFAULT_NEGATIVE_PROMPT,
  sampler: "Euler a",
  width: 512,
  height: 512,
};

export const IMAGE_SIZES = [
  { label: "512x512", value: 512 },
  { label: "768x768", value: 768 },
  { label: "1024x1024", value: 1024 },
  { label: "512x768", value: "512x768" },
  { label: "768x512", value: "768x512" },
] as const;
