import { useState } from "react";
import { OllamaService } from "../services/ollama";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const useChat = (ollamaService: OllamaService) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [stopRequested, setStopRequested] = useState(false);

  const sendMessage = async (content: string, selectedModel: string) => {
    if (!content.trim() || isStreaming) return;

    const userMessage: Message = { role: "user", content: content.trim() };
    const assistantMessage: Message = { role: "assistant", content: "" };

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

  return {
    messages,
    isStreaming,
    sendMessage,
    stopStreaming,
  };
};
