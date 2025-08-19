/**
 * Service for interacting with the Stable Diffusion A1111 API
 */

const STABLE_DIFFUSION_BASE_URL = 'http://localhost:7860';
const RETRY_DELAY = 1000;
const MAX_RETRIES = 3;

export interface ImageGenerationParams {
  prompt: string;
  steps: number;
  cfg_scale: number;
  negative_prompt?: string;
  sampler_name: string;
  width: number;
  height: number;
}

export interface StableDiffusionResponse {
  images: string[];
  parameters: Record<string, unknown>;
  info: string;
}

export class StableDiffusionService {
  private retryCount = 0;

  /**
   * Checks if the A1111 service is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const response = await fetch(
        `${STABLE_DIFFUSION_BASE_URL}/internal/ping`,
        {
          method: 'GET',
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Gets available samplers from A1111
   */
  async getSamplers(): Promise<string[]> {
    try {
      const response = await fetch(
        `${STABLE_DIFFUSION_BASE_URL}/sdapi/v1/samplers`
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const samplers = await response.json();
      return samplers.map((s: { name: string }) => s.name);
    } catch (error) {
      console.error('Failed to fetch samplers:', error);
      return ['Euler', 'Euler a', 'DPM++ 2M Karras']; // fallback
    }
  }

  /**
   * Generates an image using Stable Diffusion A1111
   */
  async generateImage(params: ImageGenerationParams): Promise<string> {
    try {
      const response = await fetch(
        `${STABLE_DIFFUSION_BASE_URL}/sdapi/v1/txt2img`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: params.prompt,
            negative_prompt: params.negative_prompt || '',
            steps: params.steps,
            cfg_scale: params.cfg_scale,
            sampler_name: params.sampler_name,
            width: params.width,
            height: params.height,
            n_iter: 1,
            batch_size: 1,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: StableDiffusionResponse = await response.json();

      if (!data.images || data.images.length === 0) {
        throw new Error('No images generated');
      }

      return `data:image/png;base64,${data.images[0]}`;
    } catch (error) {
      if (this.retryCount < MAX_RETRIES) {
        this.retryCount++;
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        return this.generateImage(params);
      }
      this.retryCount = 0;
      throw error;
    }
  }

  /**
   * Gets current progress of generation (if supported)
   */
  async getProgress(): Promise<{
    progress: number;
    eta_relative: number;
  } | null> {
    try {
      const response = await fetch(
        `${STABLE_DIFFUSION_BASE_URL}/sdapi/v1/progress`
      );
      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch {
      return null;
    }
  }
}

export const stableDiffusionService = new StableDiffusionService();
