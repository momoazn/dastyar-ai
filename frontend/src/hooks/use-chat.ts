import { useQueryClient } from "@tanstack/react-query";
import { Dispatch, SetStateAction, useState } from "react";

import { useGetSelectedChatModel } from "@/atoms";
import {
  getThreadMessagesQueryKey,
  Message,
  sendMessage as sendMessageApi,
} from "@/lib/api/chat";

export const useChat = (
  messages: Message[],
  setMessages: Dispatch<SetStateAction<Message[]>>,
  threadID: number,
) => {
  const queryClient = useQueryClient();

  const [isStreaming, setIsStreaming] = useState(false);
  const [stopRequested, setStopRequested] = useState(false);

  const selectedModel = useGetSelectedChatModel();

  const sendMessage = async (content: string) => {
    if (!content.trim() || isStreaming) return;

    const userMessage: Partial<Message> = {
      id: Math.random(),
      role: "user",
      content: content.trim(),
    };

    const assistantMessage: Partial<Message> = {
      id: Math.random(),
      role: "assistant",
      content: "",
      think: "",
      model: "",
      state: "idle",
    };

    setMessages([
      ...messages,
      userMessage as Message,
      assistantMessage as Message,
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

        const newMessage: Message = {
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
        queryClient.refetchQueries({
          queryKey: getThreadMessagesQueryKey(threadID),
        });
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
