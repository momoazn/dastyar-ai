import { ORPCError } from "@orpc/server";
import { serverTexts } from "@/lib/texts";
import type { GenerateInput } from "@/procedures/images";
import { getImageThread, touchLastImageAt } from "@/repositories/image-threads";
import { createGeneratedImage } from "@/repositories/images";
import { generate } from "../ai-providers";
import { getImageUrl, saveImage } from "../storage";

export async function generateAndPersistImage(
  input: GenerateInput,
  userId: number
) {
  const thread = await getImageThread(input.threadId, userId);
  if (!thread) {
    throw new ORPCError("NOT_FOUND", {
      message: serverTexts.chat.threadNotFound,
      status: 404,
    });
  }

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
  await touchLastImageAt(input.threadId, userId);

  return {
    id: savedImage.id,
    url: getImageUrl(savedImage.id),
    prompt: savedImage.prompt,
    createdAt: savedImage.createdAt,
    settings: savedImage.settings,
  };
}
