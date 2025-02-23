import { useEffect, useState } from "react";
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

const defaultSettings: ImageGenerationParams = {
  prompt: "",
  steps: 10,
  guidanceScale: 5,
  negativePrompt: "",
  sampler_index: "Euler",
  width: 512,
  height: 512,
};

export const useImageSettings = () => {
  const [settings, setSettingsState] = useState<ImageGenerationParams>(() => {
    const savedSettings = localStorage.getItem("imageSettings");
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
    return defaultSettings;
  });

  const setSettings = (newSettings: ImageGenerationParams) => {
    setSettingsState(newSettings);
    localStorage.setItem("imageSettings", JSON.stringify(newSettings));
  };

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("imageSettings");
    if (savedSettings) {
      setSettingsState(JSON.parse(savedSettings));
    }
  }, []);

  return {
    settings,
    setSettings,
  };
};
