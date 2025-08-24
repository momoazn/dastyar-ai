import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { toast } from 'sonner';
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
  id: string;
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

export function useImageGeneration() {
  // Query for service availability
  const { data: serviceStatus, refetch: checkAvailability } = useQuery(
    orpc.images.checkService.queryOptions()
  );

  // Query for generated images list
  const {
    data: images = [],
    refetch: refetchImages,
    isLoading: isLoadingImages,
  } = useQuery(orpc.images.list.queryOptions());

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

  // Mutation for deleting images
  const deleteMutation = useMutation(
    orpc.images.delete.mutationOptions({
      onSuccess: () => {
        toast.success('تصویر حذف شد');
        refetchImages();
      },
      onError: (error) => {
        console.error('Image deletion failed:', error);
        toast.error('خطا در حذف تصویر');
      },
    })
  );

  // Mutation for clearing all images
  const clearMutation = useMutation(
    orpc.images.clear.mutationOptions({
      onSuccess: () => {
        toast.success('تاریخچه تصاویر پاک شد');
        refetchImages();
      },
      onError: (error) => {
        console.error('Clear images failed:', error);
        toast.error('خطا در پاک کردن تصاویر');
      },
    })
  );

  const generateImage = useCallback(
    (settings: ImageGenerationParams) => {
      if (!settings.prompt.trim()) {
        toast.error('لطفاً توضیحات تصویر را وارد کنید');
        return;
      }

      if (generateMutation.isPending) {
        toast.error('در حال تولید تصویر قبلی');
        return;
      }

      if (!serviceStatus?.available) {
        toast.error('سرویس Stable Diffusion در دسترس نیست');
        return;
      }

      generateMutation.mutate(settings);
    },
    [generateMutation, serviceStatus?.available]
  );

  const generateImageAsync = useCallback(
    async (settings: ImageGenerationParams) => {
      if (!settings.prompt.trim()) {
        toast.error('لطفاً توضیحات تصویر را وارد کنید');
        return null;
      }

      if (generateMutation.isPending) {
        toast.error('در حال تولید تصویر قبلی');
        return null;
      }

      if (!serviceStatus?.available) {
        toast.error('سرویس Stable Diffusion در دسترس نیست');
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
    [generateMutation, serviceStatus?.available]
  );

  const deleteImage = useCallback(
    (imageId: string) => {
      deleteMutation.mutate({ id: imageId });
    },
    [deleteMutation]
  );

  const clearHistory = useCallback(() => {
    clearMutation.mutate({});
  }, [clearMutation]);

  const downloadImage = useCallback((image: GeneratedImage) => {
    try {
      const link = document.createElement('a');
      link.href = image.imageUrl;
      link.download = `generated_${image.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('تصویر دانلود شد');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('خطا در دانلود تصویر');
    }
  }, []);

  return {
    images,
    samplers: samplersData?.samplers || [],
    isGenerating: generateMutation.isPending,
    isServiceAvailable: serviceStatus?.available,
    isLoadingImages,
    generateImage,
    generateImageAsync,
    clearHistory,
    deleteImage,
    downloadImage,
    checkAvailability,
  };
}
