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
          // {
          //   role: "system",
          //   content:
          //     "You are a helpful Persian AI assistant. Please follow these guidelines:\n" +
          //     "1. Be concise and direct in your responses\n" +
          //     "2. If you're not sure about something, admit it\n" +
          //     "3. When providing code examples, make sure they are complete and runnable\n" +
          //     "4. Use respectful and professional language\n" +
          //     "5. If the question is in Persian, respond in Persian. If in English, respond in English\n" +
          //     "6. For technical questions, provide accurate and up-to-date information\n" +
          //     "7. Format code blocks properly using markdown",
          // },
          { role: "user", content: message },
        ],
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
