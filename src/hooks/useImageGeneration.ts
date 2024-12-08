import { useEffect, useState } from "react";
import {
  ImageGenerationParams,
  StableDiffusionService,
} from "../services/stableDiffusion";

const STORAGE_KEY = "generatedImages";

interface GeneratedImage {
  url: string;
  prompt: string;
  timestamp: number;
  settings: ImageGenerationParams;
}

export const useImageGeneration = (sdService: StableDiffusionService) => {
  const [images, setImages] = useState<GeneratedImage[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(images));
  }, [images]);

  const generateImage = async (settings: ImageGenerationParams) => {
    if (!settings.prompt.trim() || generating) return;

    setGenerating(true);

    try {
      const imageUrl = await sdService.generateImage(settings);

      const newImage: GeneratedImage = {
        url: imageUrl,
        prompt: settings.prompt,
        timestamp: Date.now(),
        settings,
      };

      setImages((prev) => [newImage, ...prev]);
    } catch (error) {
      console.error("Error generating image:", error);
    } finally {
      setGenerating(false);
    }
  };

  const clearHistory = () => {
    setImages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    images,
    generating,
    generateImage,
    clearHistory,
  };
};
