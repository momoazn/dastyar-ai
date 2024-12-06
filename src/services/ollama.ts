/**
 * Service for interacting with the Ollama API
 * @module services/ollama
 */

import { MAX_RETRIES, RETRY_DELAY } from "../config/constants";

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
  private config: OllamaConfig;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;

  /**
   * Creates an instance of OllamaService
   * @param config - Configuration options
   */
  constructor(config: OllamaConfig) {
    this.config = {
      maxRetries: MAX_RETRIES,
      ...config,
    };
  }

  /**
   * Connects to the Ollama WebSocket server
   * @returns Promise that resolves when connected
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(`${this.config.baseUrl}/api/chat`);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onerror = (error) => {
          if (
            this.reconnectAttempts < (this.config.maxRetries || MAX_RETRIES)
          ) {
            setTimeout(() => this.reconnect(), RETRY_DELAY);
          } else {
            reject(error);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Attempts to reconnect to the WebSocket server
   */
  private async reconnect(): Promise<void> {
    this.reconnectAttempts++;
    try {
      await this.connect();
    } catch (error) {
      console.error("Reconnection failed:", error);
    }
  }

  /**
   * Sends a message to the Ollama API
   * @param message - Message to send
   * @returns Promise with the response
   */
  async sendMessage(message: string): Promise<string> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      if (!this.ws) {
        reject(new Error("WebSocket not initialized"));
        return;
      }

      this.ws.send(
        JSON.stringify({
          model: this.config.model,
          messages: [{ role: "user", content: message }],
        }),
      );

      let response = "";

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.done) {
          resolve(response);
        } else {
          response += data.message;
        }
      };

      this.ws.onerror = reject;
    });
  }

  /**
   * Closes the WebSocket connection
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
