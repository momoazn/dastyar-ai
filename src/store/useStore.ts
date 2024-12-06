import { create } from "zustand";
import { ConnectionStatus, ImageGenerationParams } from "../types";

interface AppState {
  connectionStatus: ConnectionStatus;
  setConnectionStatus: (status: Partial<ConnectionStatus>) => void;
  recording: boolean;
  setRecording: (recording: boolean) => void;
  audioLevel: number;
  setAudioLevel: (level: number) => void;
  generatedImages: string[];
  addGeneratedImage: (imageUrl: string) => void;
  imageParams: ImageGenerationParams;
  setImageParams: (params: Partial<ImageGenerationParams>) => void;
}

export const useStore = create<AppState>((set) => ({
  connectionStatus: {
    ollama: false,
    stableDiffusion: false,
  },
  setConnectionStatus: (status) =>
    set((state) => ({
      connectionStatus: { ...state.connectionStatus, ...status },
    })),
  recording: false,
  setRecording: (recording) => set({ recording }),
  audioLevel: 0,
  setAudioLevel: (audioLevel) => set({ audioLevel }),
  generatedImages: [],
  addGeneratedImage: (imageUrl) =>
    set((state) => ({
      generatedImages: [...state.generatedImages, imageUrl],
    })),
  imageParams: {
    prompt: "",
    size: "512x512",
    steps: 20,
    guidanceScale: 7.5,
  },
  setImageParams: (params) =>
    set((state) => ({
      imageParams: { ...state.imageParams, ...params },
    })),
}));
