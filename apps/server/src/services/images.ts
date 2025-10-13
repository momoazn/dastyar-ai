import { touchLastImageAt } from "@/repositories/image-threads";
import { createGeneratedImage } from "@/repositories/images";
import { saveImage } from "./image-storage";
import { generate, ping } from "./stable-diffusion";

export type GenerateInput = {
  prompt: string;
  negativePrompt?: string;
  steps: number;
  cfgScale: number;
  sampler: string;
  width: number;
  height: number;
  threadId: number;
};

export async function generateAndPersistImage(
  input: GenerateInput,
  userId: number
) {
  // Check service availability
  const available = await ping();
  if (!available) {
    throw new Error("Stable Diffusion service is not available");
  }

  // Generate base64 image
  const base64Image = await generate({
    prompt: input.prompt,
    steps: input.steps,
    cfgScale: input.cfgScale,
    negativePrompt: input.negativePrompt,
    sampler: input.sampler,
    width: input.width,
    height: input.height,
  });

  // Save image to storage
  const storageResult = await saveImage(base64Image, {
    id: "temp",
    prompt: input.prompt,
    negativePrompt: input.negativePrompt,
    settings: {
      steps: input.steps,
      cfgScale: input.cfgScale,
      sampler: input.sampler,
      width: input.width,
      height: input.height,
    },
  });

  // Save metadata to database
  const savedImage = await createGeneratedImage({
    prompt: input.prompt,
    negativePrompt: input.negativePrompt || null,
    filePath: storageResult.filePath,
    fileName: storageResult.fileName,
    settings: {
      steps: input.steps,
      cfgScale: input.cfgScale,
      sampler: input.sampler,
      width: input.width,
      height: input.height,
    },
    threadId: input.threadId,
    userId,
  });

  // Update thread's last image timestamp
  await touchLastImageAt(input.threadId);

  return savedImage;
}
