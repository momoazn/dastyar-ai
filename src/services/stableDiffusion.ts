/**
 * Service for interacting with the Stable Diffusion API
 * @module services/stableDiffusion
 */

const STABLE_DIFFUSION_BASE_URL = "http://localhost:7860";
const RETRY_DELAY = 1000;
const MAX_RETRIES = 3;

export interface ImageGenerationParams {
  prompt: string;
  steps: number;
  guidanceScale: number;
  negativePrompt?: string;
  sampler_index: "Euler";
  width: number;
  height: number;
}

/**
 * Class for handling Stable Diffusion API interactions
 */
export class StableDiffusionService {
  private retryCount = 0;

  /**
   * Checks if the service is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const response = await fetch(STABLE_DIFFUSION_BASE_URL);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Generates an image using Stable Diffusion
   * @param params - Image generation parameters
   * @returns Promise with the generated image data
   */
  async generateImage(params: ImageGenerationParams): Promise<string> {
    try {
      const response = await fetch(
        `${STABLE_DIFFUSION_BASE_URL}/sdapi/v1/txt2img`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(params),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return `data:image/png;base64,${data.images[0]}`;
    } catch (error) {
      if (this.retryCount < MAX_RETRIES) {
        this.retryCount++;
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        return this.generateImage(params);
      }
      throw error;
    }
  }
}
