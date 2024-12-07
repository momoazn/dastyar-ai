/**
 * Custom hook for managing service connections
 * @module hooks/useServices
 */

import { useEffect } from "react";
import { STABLE_DIFFUSION_CONFIG } from "../config/constants";
import { OllamaService } from "../services/ollama";
import { StableDiffusionService } from "../services/stableDiffusion";
import { useStore } from "../store/useStore";

const isWhisperAvailable = async () => {
  const response = await fetch("http://localhost:8000/models");
  return response.ok;
};

export const useServices = () => {
  const [setConnectionStatus, setOllamaModels] = useStore((state) => [
    state.setConnectionStatus,
    state.setOllamaModels,
  ]);

  useEffect(() => {
    const checkAvailability = async () => {
      const [ollamaAvailable, sdAvailable, whisperAvailable] =
        await Promise.all([
          OllamaService.checkAvailability(),
          StableDiffusionService.checkAvailability(
            STABLE_DIFFUSION_CONFIG.baseUrl
          ),
          isWhisperAvailable(),
        ]);

      setConnectionStatus({
        ollama: ollamaAvailable,
        stableDiffusion: sdAvailable,
        whisper: whisperAvailable,
      });

      const models = await OllamaService.getModels();
      setOllamaModels(models);
    };

    checkAvailability();
    const interval = setInterval(checkAvailability, 30000);

    return () => clearInterval(interval);
  }, [setConnectionStatus]);
};
