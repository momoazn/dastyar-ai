/**
 * Service for interacting with the our Whisper API
 * @module services/whisper
 */

// const WHISPER_BASE_URL = "http://localhost:8000";
const WHISPER_BASE_URL = "http://192.168.78.107:8000/";

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
      const json = await response.json();
      return json.models;
    } catch {
      return [];
    }
  }

  async transcribe(audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.wav");
    const response = await fetch(`${WHISPER_BASE_URL}/transcribe`, {
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
