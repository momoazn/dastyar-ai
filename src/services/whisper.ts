/**
 * Service for interacting with the our Whisper API
 * @module services/whisper
 */

const WHISPER_BASE_URL = "http://localhost:8080/api/v1";

type Model = {
  id: string;
  object: string;
  path: string;
  created: number;
};

type ModelResponse = {
  models: Model[];
};

/**
 * Class for handling Whisper API interactions
 */
export class WhisperService {
  /**
   * Checks if the service is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${WHISPER_BASE_URL}/models`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async getModels(): Promise<string[]> {
    try {
      const response = await fetch(`${WHISPER_BASE_URL}/models`);
      const json: ModelResponse = await response.json();
      return json.models.map((item) => item.id.split("ggml-").at(0) ?? "");
    } catch {
      return [];
    }
  }

  async transcribe(audioBlob: Blob, model: string): Promise<string> {
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.wav");
    formData.append("model", model);
    const response = await fetch(`${WHISPER_BASE_URL}/audio/transcriptions`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        `Transcription failed: ${response.status} ${errorData?.detail || ""}`,
      );
    }

    const { text } = await response.json();
    return text;
  }
}
