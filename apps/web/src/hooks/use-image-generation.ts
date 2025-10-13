import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";
import { fa } from "@/lib/persian-texts";
import type { GenerateInput } from "@/server/procedures/images";
import { type OrpcClient, orpc } from "@/utils/orpc";

export type GeneratedImage = Awaited<
  ReturnType<OrpcClient["images"]["listByThread"]>
>[number];

export function useImageGeneration(threadId?: number) {
  // Query for service availability
  const { data: serviceStatus } = useQuery(
    orpc.images.checkService.queryOptions()
  );

  // Query for generated images list by thread

  const { data: images = [], refetch: refetchImages } = useQuery(
    orpc.images.listByThread.queryOptions({
      input: { threadId: threadId ?? 0 },
      enabled: !!threadId,
    })
  );

  // Query for available samplers
  const { data: samplersData } = useQuery(
    orpc.images.getSamplers.queryOptions()
  );

  // Mutation for generating images
  const generateMutation = useMutation(
    orpc.images.generate.mutationOptions({
      onSuccess: () => {
        toast.success("تصویر با موفقیت تولید شد");
        refetchImages();
      },
      onError: (error) => {
        const errorMessage =
          error instanceof Error ? error.message : "خطای ناشناخته";
        toast.error(`خطا در تولید تصویر: ${errorMessage}`);
      },
    })
  );

  const generate = useCallback(
    async (input: GenerateInput): Promise<GeneratedImage | null> => {
      if (!input.prompt.trim()) {
        toast.error("لطفاً توضیحات تصویر را وارد کنید");
        return null;
      }
      if (!input.threadId) {
        toast.error("شناسه گفتگو الزامی است");
        return null;
      }
      if (generateMutation.isPending) {
        toast.error("در حال تولید تصویر قبلی");
        return null;
      }
      if (!serviceStatus?.available) {
        toast.error("سرویس Stable Diffusion در دسترس نیست");
        return null;
      }

      try {
        const result = await generateMutation.mutateAsync(input);
        return result as unknown as GeneratedImage;
      } catch {
        // Error toast is handled in onError
        return null;
      }
    },
    [generateMutation, serviceStatus?.available]
  );

  const downloadImage = useCallback((image: { id: number; url: string }) => {
    try {
      const link = document.createElement("a");
      link.href = image.url;
      link.download = `generated_${image.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(fa.imageGeneration.downloadSuccess);
    } catch {
      toast.error(fa.imageGeneration.downloadError);
    }
  }, []);

  return {
    images,
    samplers: samplersData?.samplers || [],
    isServiceAvailable: serviceStatus?.available,
    isGenerating: generateMutation.isPending,
    generate,
    downloadImage,
    refetchImages,
  };
}
