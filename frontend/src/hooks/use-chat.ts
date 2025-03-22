import { Dispatch, SetStateAction, useState } from "react";

import {
  type ChatMessage,
  sendMessage as sendMessageApi,
} from "@/lib/api/chat";

interface UseChatOptions {
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
}

/**
 * Hook for managing chat interactions including message sending and streaming
 */
export const useChat = (
  messages: ChatMessage[],
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>,
  options?: UseChatOptions
) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [stopRequested, setStopRequested] = useState(false);

  /**
   * Creates a temporary message object for immediate display
   */
  const createTempMessage = (
    role: "user" | "assistant",
    content: string = ""
  ): ChatMessage => ({
    id: Math.random(),
    role,
    content,
    think: "",
    model: "",
    state: role === "assistant" ? "idle" : undefined,
  } as ChatMessage);

  /**
   * Sends a prompt message and handles streaming the response
   */
  const sendPrompt = async (
    prompt: string,
    threadID: number,
    model: string,
    onDone?: () => void,
  ) => {
    // Validate input
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || isStreaming) return;

    // Create temporary messages for immediate UI feedback
    const userMessage = createTempMessage("user", trimmedPrompt);
    const assistantMessage = createTempMessage("assistant");

    // Update UI with new messages
    setMessages([...messages, userMessage, assistantMessage]);

    // Setup streaming state
    setIsStreaming(true);
    setStopRequested(false);
    options?.onStreamStart?.();

    // Track content for accumulation
    let fullContent = "";
    let fullThink = "";

    try {
      // Send message to API with streaming
      await sendMessageApi(
        threadID,
        trimmedPrompt,
        model,
        true,
        (chunk) => {
          // Stop processing if stop was requested
          if (stopRequested) return;

          // Accumulate content based on state
          if (chunk.state === "thinking") {
            fullThink += chunk.think ?? "";
          } else if (chunk.state === "responding") {
            fullContent += chunk.content ?? "";
          }

          // Update the UI with accumulated content
          updateAssistantMessage({
            ...chunk,
            content: fullContent,
            think: fullThink,
          });
        },
        handleStreamComplete(onDone)
      );
    } catch (error) {
      console.error("Error sending message:", error);
      handleStreamComplete(onDone)();
    }
  };

  /**
   * Updates the assistant's message in the message list
   */
  const updateAssistantMessage = (updatedMessage: ChatMessage) => {
    setMessages((prev) => {
      const newMessages = [...prev];
      newMessages[newMessages.length - 1] = updatedMessage;
      return newMessages;
    });
  };

  /**
   * Creates a handler for stream completion
   */
  const handleStreamComplete = (callback?: () => void) => () => {
    setIsStreaming(false);
    options?.onStreamEnd?.();
    callback?.();
  };

  /**
   * Stops the current streaming response
   */
  const stopStreaming = () => {
    setStopRequested(true);
    setIsStreaming(false);
    options?.onStreamEnd?.();
  };

  return {
    isStreaming,
    sendPrompt,
    stopStreaming,
  };
};
