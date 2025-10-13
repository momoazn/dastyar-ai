import type { GenerateInput } from "@/procedures/images";
import { touchLastImageAt } from "@/repositories/image-threads";
import { createGeneratedImage } from "@/repositories/images";
import { getImageUrl, saveImage } from "./image-storage";
import { generate } from "./stable-diffusion";

export async function generateAndPersistImage(
  input: GenerateInput,
  userId: number
) {
  // Generate base64 image (includes availability check)
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
  const storageResult = await saveImage(base64Image);

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

  return {
    id: savedImage.id,
    url: getImageUrl(savedImage.id),
    prompt: savedImage.prompt,
    createdAt: savedImage.createdAt,
    settings: savedImage.settings,
  };
}
