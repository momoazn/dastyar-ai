export interface Message {
  id: number;
  session_id: number;
  role: string;
  content: string;
  created_at: string;
  model: string;
}

export interface Session {
  id: number;
  title: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

const baseUrl = "http://localhost:8080/api";

export class ChatService {
  private async fetchApi<T>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<T> {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${endpoint}`);
    }

    return options?.method === "DELETE" ? undefined : response.json();
  }

  async getAllSessions(): Promise<Session[]> {
    return this.fetchApi<Session[]>("/sessions");
  }

  async createSession(title: string): Promise<Session> {
    return this.fetchApi<Session>("/sessions", {
      method: "POST",
      body: JSON.stringify({ title }),
    });
  }

  async getSession(id: number): Promise<Session> {
    return this.fetchApi<Session>(`/sessions/${id}`);
  }

  async deleteSession(id: number): Promise<void> {
    return this.fetchApi<void>(`/sessions/${id}`, {
      method: "DELETE",
    });
  }

  async streamChat(
    sessionId: number,
    message: string,
    model: string,
    onChunk: (chunk: string) => void,
  ): Promise<void> {
    const response = await fetch(`${baseUrl}/sessions/${sessionId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, model }),
    });

    if (!response.ok) throw new Error("Failed to send message");

    const reader = response.body?.getReader();
    if (!reader) throw new Error("Failed to get response reader");

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const content = line.slice(6);
          onChunk(content);
        }
      }
    }
  }
}
