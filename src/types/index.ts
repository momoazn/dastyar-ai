export interface ImageGenerationParams {
  prompt: string;
  size: '512x512' | '768x768' | '1024x1024';
  steps: number;
  guidanceScale: number;
}

export interface ConnectionStatus {
  ollama: boolean;
  stableDiffusion: boolean;
}