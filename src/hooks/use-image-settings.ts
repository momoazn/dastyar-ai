import { useState } from "react";
import { ImageGenerationParams } from "@/services/stable-diffusion";

export const samplers = [
  "Euler",
  "Euler a",
  "LMS",
  "Heun",
  "DPM2",
  "DPM2 a",
  "DPM++ 2S a",
  "DPM++ 2M",
  "DPM++ SDE",
  "DPM fast",
  "DPM adaptive",
  "LMS Karras",
  "DPM2 Karras",
  "DPM2 a Karras",
  "DPM++ 2S a Karras",
  "DPM++ 2M Karras",
  "DPM++ SDE Karras",
] as const;

export const useImageSettings = () => {
  const [settings, setSettings] = useState<ImageGenerationParams>({
    prompt: "",
    steps: 10,
    guidanceScale: 5,
    negativePrompt: "",
    sampler_index: "Euler",
    width: 512,
    height: 512,
  });

  return {
    settings,
    setSettings,
  };
};