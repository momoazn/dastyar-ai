import { Dispatch, SetStateAction, useState } from "react";

import { type Message, sendMessage as sendMessageApi } from "@/lib/api/chat";

interface UseChatOptions {
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
}

/**
 * Hook for managing chat interactions including message sending and streaming
 */
export const useChat = (
  messages: Message[],
  setMessages: Dispatch<SetStateAction<Message[]>>,
  options?: UseChatOptions,
) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [stopRequested, setStopRequested] = useState(false);

  /**
   * Creates a temporary message object for immediate display
   */
  const createTempMessage = (
    role: "user" | "assistant",
    content: string = "",
  ): Message =>
    ({
      id: Math.random(),
      conversation_id: 0,
      role,
      content,
      reasoning: "",
      ai_model: "",
      status: role === "assistant" ? "idle" : undefined,
      sent_at: new Date().toISOString(),
    }) as Message;

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
    let fullReasoning = "";

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
          if (chunk.status === "reasoning") {
            fullReasoning += chunk.reasoning ?? "";
          } else if (chunk.status === "responding") {
            fullContent += chunk.content ?? "";
          }

          // Update the UI with accumulated content
          updateAssistantMessage({
            ...chunk,
            content: fullContent,
            reasoning: fullReasoning,
          });
        },
        handleStreamComplete(onDone),
      );
    } catch (error) {
      console.error("Error sending message:", error);
      handleStreamComplete(onDone)();
    }
  };

  /**
   * Updates the assistant's message in the message list
   */
  const updateAssistantMessage = (updatedMessage: Message) => {
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
