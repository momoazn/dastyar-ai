import { useCallback, useState } from "react";
import type { DbMessage } from "../../generated/apiSchemas";

interface StreamingChatOptions {
  onMessageUpdate: (message: DbMessage) => void;
  onComplete: () => void;
  onError: (error: string) => void;
}

interface ChatRequest {
  content: string;
  model: string;
  thread_id: string;
}

export function useStreamingChat() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const sendMessage = useCallback(async (
    request: ChatRequest,
    options: StreamingChatOptions
  ) => {
    if (isStreaming) {
      throw new Error("Already streaming a message");
    }

    const controller = new AbortController();
    setAbortController(controller);
    setIsStreaming(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            try {
              const message: DbMessage = JSON.parse(line);
              options.onMessageUpdate(message);
            } catch (parseError) {
              console.warn("Failed to parse streaming chunk:", parseError);
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      options.onComplete();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log("Chat stream was aborted by user");
        // Call onComplete for aborted streams since the backend saves the partial message
        options.onComplete();
      } else {
        console.error("Streaming error:", error);
        options.onError(error instanceof Error ? error.message : "Unknown error");
      }
    } finally {
      setIsStreaming(false);
      setAbortController(null);
    }
  }, [isStreaming]);

  const stopStreaming = useCallback(() => {
    if (abortController) {
      abortController.abort();
    }
  }, [abortController]);

  return {
    sendMessage,
    stopStreaming,
    isStreaming,
  };
} 