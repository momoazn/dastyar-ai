/**
 * Application-wide constants
 * @module config/constants
 */

export const MAX_RETRIES = 3;
export const RETRY_DELAY = 1000;

export const OLLAMA_CONFIG = {
  baseUrl: "ws://localhost:11434",
  model: "llama2",
};

export const STABLE_DIFFUSION_CONFIG = {
  baseUrl: "http://localhost:7860",
};
