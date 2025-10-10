import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { fa } from '@/lib/persian-texts';
import { orpc } from '@/utils/orpc';

export interface ImageGenerationParams {
  prompt: string;
  steps: number;
  cfg_scale: number;
  negative_prompt?: string;
  sampler_name: string;
  width: number;
  height: number;
}

export interface GeneratedImage {
  id: number;
  imageUrl: string;
  prompt: string;
  negativePrompt?: string | null;
  createdAt: string | null | Date;
  settings?: {
    steps: number;
    cfg_scale: number;
    sampler_name: string;
    width: number;
    height: number;
  };
}

export function useImageGeneration(threadId?: number) {
  // Centralized validation used by both sync/async generate
  const validateRequest = useCallback(
    (
      settings: ImageGenerationParams & { threadId: number },
      opts: { isPending: boolean; isServiceAvailable?: boolean }
    ): string | null => {
      if (!settings.prompt.trim()) {
        return 'لطفاً توضیحات تصویر را وارد کنید';
      }
      if (!settings.threadId) {
        return 'شناسه گفتگو الزامی است';
      }
      if (opts.isPending) {
        return 'در حال تولید تصویر قبلی';
      }
      if (!opts.isServiceAvailable) {
        return 'سرویس Stable Diffusion در دسترس نیست';
      }
      return null;
    },
    []
  );
  // Query for service availability
  const { data: serviceStatus, refetch: checkAvailability } = useQuery(
    orpc.images.checkService.queryOptions()
  );

  // Query for generated images list by thread
  const listOptions = orpc.images.listByThread.queryOptions({
    input: { threadId: threadId ?? 0 },
  });
  const {
    data: images = [],
    refetch: refetchImages,
    isLoading: isLoadingImages,
  } = useQuery({ ...listOptions, enabled: !!threadId });

  // Query for available samplers
  const { data: samplersData } = useQuery(
    orpc.images.getSamplers.queryOptions()
  );

  // Mutation for generating images
  const generateMutation = useMutation(
    orpc.images.generate.mutationOptions({
      onSuccess: () => {
        toast.success('تصویر با موفقیت تولید شد');
        refetchImages();
      },
      onError: (error) => {
        console.error('Image generation failed:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'خطای ناشناخته';
        toast.error(`خطا در تولید تصویر: ${errorMessage}`);
      },
    })
  );

  const generateImage = useCallback(
    (settings: ImageGenerationParams & { threadId: number }) => {
      const validationError = validateRequest(settings, {
        isPending: generateMutation.isPending,
        isServiceAvailable: serviceStatus?.available,
      });
      if (validationError) {
        toast.error(validationError);
        return;
      }
      generateMutation.mutate(settings);
    },
    [generateMutation, serviceStatus?.available, validateRequest]
  );

  const generateImageAsync = useCallback(
    async (settings: ImageGenerationParams & { threadId: number }) => {
      const validationError = validateRequest(settings, {
        isPending: generateMutation.isPending,
        isServiceAvailable: serviceStatus?.available,
      });
      if (validationError) {
        toast.error(validationError);
        return null;
      }
      try {
        const result = await generateMutation.mutateAsync(settings);
        return result as unknown as GeneratedImage;
      } catch {
        // Error toast is handled in onError
        return null;
      }
    },
    [generateMutation, serviceStatus?.available, validateRequest]
  );

  const downloadImage = useCallback((image: GeneratedImage) => {
    try {
      const link = document.createElement('a');
      link.href = image.imageUrl;
      link.download = `generated_${image.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(fa.imageGeneration.downloadSuccess);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error(fa.imageGeneration.downloadError);
    }
  }, []);

  return {
    images,
    refetchImages,
    samplers: samplersData?.samplers || [],
    isGenerating: generateMutation.isPending,
    isServiceAvailable: serviceStatus?.available,
    isLoadingImages,
    generateImage,
    generateImageAsync,
    downloadImage,
    checkAvailability,
  };
}
