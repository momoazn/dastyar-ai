import { useEffect, useMemo, useState } from "react";
import { OllamaService } from "../services/ollama";

const STORAGE_KEY = "chatHistory";

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface MessageWithThinking extends Message {
  finishedThinking?: boolean;
  think?: string;
}

export const usePersistentChat = (ollamaService: OllamaService) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [isStreaming, setIsStreaming] = useState(false);
  const [stopRequested, setStopRequested] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const sendMessage = async (content: string, selectedModel: string) => {
    if (!content.trim() || isStreaming) return;

    const userMessage: Message = {
      role: "user",
      content: content.trim(),
      timestamp: Date.now(),
    };
    const assistantMessage: Message = {
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsStreaming(true);
    setStopRequested(false);

    let streamedContent = "";
    await ollamaService.chat(userMessage.content, selectedModel, (token) => {
      if (stopRequested) return;

      streamedContent += token;
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].content = streamedContent;
        return newMessages;
      });
    });

    setIsStreaming(false);
  };

  const stopStreaming = () => {
    setStopRequested(true);
    setIsStreaming(false);
  };

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    messages,
    isStreaming,
    sendMessage,
    stopStreaming,
    clearHistory,
  };
};

export function useMessagesWithThinking(messages: Message[]) {
  return useMemo(
    () =>
      messages.map((m: Message): MessageWithThinking => {
        if (m.role === "assistant") {
          if (m.content.includes("</think>")) {
            return {
              ...m,
              finishedThinking: true,
              think: m.content
                .split("</think>")[0]
                .replace("</think>", "")
                .replace("<think>", ""),
              content: m.content.split("</think>")[1],
            };
          } else {
            return {
              ...m,
              finishedThinking: false,
              think: m.content.replace("<think>", ""),
              content: "",
            };
          }
        }
        return m;
      }),
    [messages],
  );
}
