/**
 * Service for interacting with the Ollama API
 * @module services/ollama
 */

import { Ollama } from "ollama/browser";
import { ChatSettings } from "@/hooks/use-chat-settings";

const OLLAMA_BASE_URL = "http://localhost:11434";

export const THINKING_MODELS = ["deepseek-r1", "deepscaler"]

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
  private settings: ChatSettings | null = null;

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
   * Updates the service settings
   */
  updateSettings(settings: ChatSettings) {
    this.settings = settings;
    this.ollama = new Ollama({
      host: settings.baseUrl,
    });
  }

  /**
   * Checks if the service is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      await this.ollama.list();
      return true;
    } catch {
      return false;
    }
  }

  async getModels(): Promise<string[]> {
    try {
      const models = await this.ollama.list();
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
    onToken?: (token: string) => void,
  ): Promise<string> {
    try {
      let fullResponse = "";
      const response = await this.ollama.chat({
        model,
        messages: [
          ...(this.settings?.systemPrompt
            ? [{ role: "system" as const, content: this.settings.systemPrompt }]
            : []),
          { role: "user" as const, content: message },
        ],
        options: {
          temperature: this.settings?.temperature,
          top_p: this.settings?.topP,
          presence_penalty: this.settings?.presencePenalty,
          frequency_penalty: this.settings?.frequencyPenalty,
        },
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
