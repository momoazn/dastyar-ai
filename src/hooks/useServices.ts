/**
 * Custom hook for managing service connections
 * @module hooks/useServices
 */

import { useEffect, useState } from "react";
import { OllamaService } from "../services/ollama";
import { StableDiffusionService } from "../services/stableDiffusion";

export interface ConnectionStatus {
  ollama: boolean;
  stableDiffusion: boolean;
  whisper: boolean;
}

const isWhisperAvailable = async () => {
  try {
    const response = await fetch("http://localhost:8000/models");
    return response.ok;
  } catch (error) {
    return false;
  }
};

export const useServices = (
  ollamaService: OllamaService,
  sdService: StableDiffusionService,
) => {
  const [connectionsStatus, setConnectionsStatus] = useState<ConnectionStatus>({
    ollama: false,
    stableDiffusion: false,
    whisper: false,
  });
  const [ollamaModels, setOllamaModels] = useState<string[]>();

  const checkAvailability = async () => {
    const [ollamaAvailable, sdAvailable, whisperAvailable] = await Promise.all([
      ollamaService.checkAvailability(),
      sdService.checkAvailability(),
      isWhisperAvailable(),
    ]);

    console.log({ ollamaAvailable, sdAvailable, whisperAvailable });

    setConnectionsStatus({
      ollama: ollamaAvailable,
      stableDiffusion: sdAvailable,
      whisper: whisperAvailable,
    });

    const models = await ollamaService.getModels();
    setOllamaModels(models);
  };

  useEffect(() => {
    checkAvailability();
    const interval = setInterval(checkAvailability, 30000);

    return () => clearInterval(interval);
  }, [setConnectionsStatus]);

  return [connectionsStatus, ollamaModels] as const;
};
