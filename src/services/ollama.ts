/**
 * Service for interacting with the Ollama API
 * @module services/ollama
 */

import { Ollama } from "ollama/browser";

const OLLAMA_BASE_URL = "http://localhost:11434";

/**
 * Configuration for Ollama service
 */
export interface OllamaConfig {
  baseUrl: string;
  model: string;
  maxRetries?: number;
}

/**
 * Class for handling Ollama API interactions
 */
export class OllamaService {
  private ollama: Ollama;

  /**
   * Creates an instance of OllamaService
   * @param config - Configuration options
   */
  constructor() {
    this.ollama = new Ollama({
      host: OLLAMA_BASE_URL,
    });
  }

  /**
   * Checks if the service is available
   */
  static async checkAvailability(): Promise<boolean> {
    try {
      const ollama = new Ollama({
        host: OLLAMA_BASE_URL,
      });
      await ollama.list();
      return true;
    } catch {
      return false;
    }
  }

  static async getModels(): Promise<string[]> {
    try {
      const ollama = new Ollama({
        host: OLLAMA_BASE_URL,
      });
      const models = await ollama.list();
      return models.models.map((model) => model.name);
    } catch {
      return [];
    }
  }

  /**
   * Sends a chat message to Ollama
   * @param message - Message to send
   * @param onToken - Callback for receiving streaming tokens
   */
  async chat(
    message: string,
    model: string,
    onToken?: (token: string) => void
  ): Promise<string> {
    console.log("@@@@@@ model", { message, model });

    try {
      let fullResponse = "";
      const response = await this.ollama.chat({
        model,
        messages: [{ role: "user", content: message }],
        // @ts-ignore
        stream: !!onToken,
      });

      if (onToken) {
        for await (const chunk of response) {
          const token = chunk.message?.content || "";
          fullResponse += token;
          onToken(token);
        }
        return fullResponse;
      } else {
        return response.message?.content || "";
      }
    } catch (error) {
      console.error("Error in chat:", error);
      throw error;
    }
  }
}
