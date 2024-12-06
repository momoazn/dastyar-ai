/**
 * Service for interacting with the Stable Diffusion API
 * @module services/stableDiffusion
 */

import { ImageGenerationParams } from "../types";
import { RETRY_DELAY, MAX_RETRIES } from "../config/constants";

/**
 * Configuration for Stable Diffusion service
 */
export interface StableDiffusionConfig {
  baseUrl: string;
  maxRetries?: number;
}

/**
 * Class for handling Stable Diffusion API interactions
 */
export class StableDiffusionService {
  private config: StableDiffusionConfig;
  private retryCount = 0;

  /**
   * Creates an instance of StableDiffusionService
   * @param config - Configuration options
   */
  constructor(config: StableDiffusionConfig) {
    this.config = {
      maxRetries: MAX_RETRIES,
      ...config,
    };
  }

  /**
   * Generates an image using Stable Diffusion
   * @param params - Image generation parameters
   * @returns Promise with the generated image data
   */
  async generateImage(params: ImageGenerationParams): Promise<string> {
    try {
      const response = await fetch(`${this.config.baseUrl}/sdapi/v1/txt2img`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: params.prompt,
          width: parseInt(params.size.split("x")[0]),
          height: parseInt(params.size.split("x")[1]),
          steps: params.steps,
          cfg_scale: params.guidanceScale,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return `data:image/png;base64,${data.images[0]}`;
    } catch (error) {
      if (this.retryCount < (this.config.maxRetries || MAX_RETRIES)) {
        this.retryCount++;
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        return this.generateImage(params);
      }
      throw error;
    }
  }
}
