import { Dispatch, SetStateAction, useState } from "react";

import { useGetSelectedChatModel } from "@/atoms";
import { type ChatMessage, sendMessage as sendMessageApi } from "@/lib/api/chat";

export const useChat = (
  messages: ChatMessage[],
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>,
) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [stopRequested, setStopRequested] = useState(false);

  const selectedModel = useGetSelectedChatModel();

  const sendMessage = async (
    content: string,
    threadID: number,
    onDone?: () => void,
  ) => {
    if (!content.trim() || isStreaming) return;

    const userMessage: Partial<ChatMessage> = {
      id: Math.random(),
      role: "user",
      content: content.trim(),
    };

    const assistantMessage: Partial<ChatMessage> = {
      id: Math.random(),
      role: "assistant",
      content: "",
      think: "",
      model: "",
      state: "idle",
    };

    setMessages([
      ...messages,
      userMessage as ChatMessage,
      assistantMessage as ChatMessage,
    ]);

    setIsStreaming(true);
    setStopRequested(false);

    let fullContent = "";
    let fullThink = "";

    await sendMessageApi(
      threadID,
      userMessage.content!,
      selectedModel,
      true,
      (chunk) => {
        if (stopRequested) return;

        if (chunk.state === "thinking") {
          fullThink += chunk.think ?? "";
        } else if (chunk.state === "responding") {
          fullContent += chunk.content ?? "";
        }

        const newMessage: ChatMessage = {
          ...chunk,
          content: fullContent,
          think: fullThink,
        };

        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = newMessage;
          return newMessages;
        });
      },
      () => {
        setIsStreaming(false);
        onDone?.();
      },
    );
  };

  const stopStreaming = () => {
    setStopRequested(true);
    setIsStreaming(false);
  };

  return {
    isStreaming,
    sendMessage,
    stopStreaming,
  };
};
