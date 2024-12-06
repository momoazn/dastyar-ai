/**
 * API utility functions
 * @module utils/api
 */

import { OLLAMA_CONFIG, STABLE_DIFFUSION_CONFIG } from '../config/constants';

/**
 * Checks if a service is available
 */
export const checkServiceAvailability = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Checks availability of all required services
 */
export const checkServices = async () => {
  const [ollamaAvailable, sdAvailable] = await Promise.all([
    checkServiceAvailability(OLLAMA_CONFIG.baseUrl.replace('ws://', 'http://')),
    checkServiceAvailability(STABLE_DIFFUSION_CONFIG.baseUrl)
  ]);

  return {
    ollama: ollamaAvailable,
    stableDiffusion: sdAvailable
  };
};