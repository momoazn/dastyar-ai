/**
 * Custom hook for managing service connections
 * @module hooks/useServices
 */

import { useEffect } from "react";
import { STABLE_DIFFUSION_CONFIG } from "../config/constants";
import { OllamaService } from "../services/ollama";
import { StableDiffusionService } from "../services/stableDiffusion";
import { useStore } from "../store/useStore";

export const useServices = () => {
  const [setConnectionStatus, setOllamaModels] = useStore((state) => [
    state.setConnectionStatus,
    state.setOllamaModels,
  ]);

  useEffect(() => {
    const checkAvailability = async () => {
      const [ollamaAvailable, sdAvailable] = await Promise.all([
        OllamaService.checkAvailability(),
        StableDiffusionService.checkAvailability(
          STABLE_DIFFUSION_CONFIG.baseUrl
        ),
      ]);

      setConnectionStatus({
        ollama: ollamaAvailable,
        stableDiffusion: sdAvailable,
      });

      const models = await OllamaService.getModels();
      setOllamaModels(models);
    };

    checkAvailability();
    const interval = setInterval(checkAvailability, 30000);

    return () => clearInterval(interval);
  }, [setConnectionStatus]);
};
