import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { ImageGenerationParams } from '@/lib/stable-diffusion';
import { stableDiffusionService } from '@/lib/stable-diffusion';

const STORAGE_KEY = 'generatedImages';

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  settings: ImageGenerationParams;
}

export interface ImageGenerationState {
  images: GeneratedImage[];
  isGenerating: boolean;
  progress: number;
  isServiceAvailable: boolean;
}

export function useImageGeneration() {
  const [state, setState] = useState<ImageGenerationState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return {
      images: saved ? JSON.parse(saved) : [],
      isGenerating: false,
      progress: 0,
      isServiceAvailable: false,
    };
  });

  // Save images to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.images));
  }, [state.images]);

  // Check service availability
  const checkAvailability = useCallback(async () => {
    try {
      const available = await stableDiffusionService.checkAvailability();
      setState((prev) => ({ ...prev, isServiceAvailable: available }));
      return available;
    } catch (error) {
      console.error('Failed to check SD service availability:', error);
      setState((prev) => ({ ...prev, isServiceAvailable: false }));
      return false;
    }
  }, []);

  // Check availability on mount and periodically
  useEffect(() => {
    checkAvailability();
    const interval = setInterval(checkAvailability, 30_000); // every 30s
    return () => clearInterval(interval);
  }, [checkAvailability]);

  const generateImage = useCallback(
    async (settings: ImageGenerationParams) => {
      if (!settings.prompt.trim()) {
        toast.error('لطفاً توضیحات تصویر را وارد کنید');
        return;
      }

      if (state.isGenerating) {
        toast.error('در حال تولید تصویر قبلی');
        return;
      }

      if (!state.isServiceAvailable) {
        toast.error('سرویس Stable Diffusion در دسترس نیست');
        return;
      }

      setState((prev) => ({ ...prev, isGenerating: true, progress: 0 }));

      try {
        // Start progress simulation
        const progressInterval = setInterval(() => {
          setState((prev) => ({
            ...prev,
            progress: Math.min(prev.progress + Math.random() * 10, 90),
          }));
        }, 500);

        // Try to get real progress from A1111 API
        const progressCheckInterval = setInterval(async () => {
          try {
            const progressData = await stableDiffusionService.getProgress();
            if (progressData && progressData.progress > 0) {
              setState((prev) => ({
                ...prev,
                progress: Math.round(progressData.progress * 100),
              }));
            }
          } catch {
            // Ignore progress check errors
          }
        }, 1000);

        const imageUrl = await stableDiffusionService.generateImage(settings);

        clearInterval(progressInterval);
        clearInterval(progressCheckInterval);

        setState((prev) => ({ ...prev, progress: 100 }));

        const newImage: GeneratedImage = {
          id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          url: imageUrl,
          prompt: settings.prompt,
          timestamp: Date.now(),
          settings,
        };

        setState((prev) => ({
          ...prev,
          images: [newImage, ...prev.images],
          isGenerating: false,
          progress: 0,
        }));

        toast.success('تصویر با موفقیت تولید شد');
      } catch (error) {
        console.error('Image generation failed:', error);
        setState((prev) => ({
          ...prev,
          isGenerating: false,
          progress: 0,
        }));

        const errorMessage =
          error instanceof Error ? error.message : 'خطای ناشناخته';
        toast.error(`خطا در تولید تصویر: ${errorMessage}`);
      }
    },
    [state.isGenerating, state.isServiceAvailable]
  );

  const clearHistory = useCallback(() => {
    setState((prev) => ({ ...prev, images: [] }));
    localStorage.removeItem(STORAGE_KEY);
    toast.success('تاریخچه تصاویر پاک شد');
  }, []);

  const deleteImage = useCallback((imageId: string) => {
    setState((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img.id !== imageId),
    }));
    toast.success('تصویر حذف شد');
  }, []);

  const downloadImage = useCallback((image: GeneratedImage) => {
    try {
      const link = document.createElement('a');
      link.href = image.url;
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
    ...state,
    generateImage,
    clearHistory,
    deleteImage,
    downloadImage,
    checkAvailability,
  };
}
