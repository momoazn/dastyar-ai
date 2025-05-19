import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";
import { Dispatch, SetStateAction, useState } from "react";

import { StreamResponseService } from "../utils";
import { defaultQueryOptions } from "./common";
import { ApiResponse, fetchApi, PaginatedApiResponse } from "./index";

// Type definitions
export type MessageStatus = "idle" | "reasoning" | "responding" | "done";
export type MessageRole = "user" | "assistant" | "system";

export interface ChatThread {
  id: number;
  title: string;
  llm: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  chat_thread_id: number;
  role: MessageRole;
  content: string;
  reasoning: string;
  llm: string;
  status: MessageStatus;
  sent_at: string;
}

// Query key getters
export const getChatThreadsQueryKey = () => ["chat-threads"];
export const getChatThreadMessagesQueryKey = (chatThreadId: number) => [
  "chat-thread-messages",
  chatThreadId,
];

// React Query hooks - Queries
export const useChatThreads = (
  options?: Partial<UseQueryOptions<PaginatedApiResponse<ChatThread>, Error>>,
) => {
  return useQuery({
    queryKey: getChatThreadsQueryKey(),
    queryFn: () => fetchApi<PaginatedApiResponse<ChatThread>>("/chat-threads"),
    retry: defaultQueryOptions.retry,
    refetchOnWindowFocus: defaultQueryOptions.refetchOnWindowFocus,
    staleTime: defaultQueryOptions.staleTime,
    ...options,
  });
};

export const useChatThreadMessages = (
  chatThreadId: number,
  options?: Partial<UseQueryOptions<PaginatedApiResponse<Message>, Error>>,
) => {
  return useQuery({
    queryKey: getChatThreadMessagesQueryKey(chatThreadId),
    queryFn: () =>
      fetchApi<PaginatedApiResponse<Message>>(
        `/chat-threads/${chatThreadId}/messages`,
      ),
    retry: defaultQueryOptions.retry,
    refetchOnWindowFocus: defaultQueryOptions.refetchOnWindowFocus,
    staleTime: defaultQueryOptions.staleTime,
    ...options,
  });
};

// React Query hooks - Mutations
export const useCreateChatThread = (
  options?: UseMutationOptions<
    ApiResponse<ChatThread>,
    Error,
    { title: string }
  >,
) => {
  return useMutation({
    mutationFn: ({ title }) =>
      fetchApi<ApiResponse<ChatThread>>("/chat-threads", {
        method: "POST",
        body: JSON.stringify({ title }),
      }),
    ...options,
  });
};

export const useUpdateChatThread = (
  options?: UseMutationOptions<
    ApiResponse<ChatThread>,
    Error,
    { chatThreadId: number; title: string }
  >,
) => {
  return useMutation({
    mutationFn: ({ chatThreadId, title }) =>
      fetchApi<ApiResponse<ChatThread>>(`/chat-threads/${chatThreadId}`, {
        method: "PUT",
        body: JSON.stringify({ title }),
      }),
    ...options,
  });
};

export const useDeleteChatThread = (
  options?: UseMutationOptions<
    ApiResponse<ChatThread>,
    Error,
    { chatThreadId: number }
  >,
) => {
  return useMutation({
    mutationFn: ({ chatThreadId }) =>
      fetchApi<ApiResponse<ChatThread>>(`/chat-threads/${chatThreadId}`, {
        method: "DELETE",
      }),
    ...options,
  });
};

// Direct API functions
export async function sendMessage(
  chatThreadId: number,
  content: string,
  model: string,
  stream: boolean,
  onChunk?: (chunk: Message) => void,
  onDone?: () => void,
): Promise<Message> {
  const service = new StreamResponseService();

  const response = await service.processStreamableRequest<Message>("chat", {
    content,
    model,
    chat_thread_id: chatThreadId.toString(),
    stream,
  });

  const completedMessage: Message = {
    id: 0,
    chat_thread_id: chatThreadId,
    role: "assistant",
    content: "",
    reasoning: "",
    llm: model,
    status: "idle",
    sent_at: "",
  };

  try {
    for await (const chunk of response) {
      onChunk?.(chunk);
      if (completedMessage.id === 0) {
        completedMessage.id = chunk.id;
        completedMessage.sent_at = chunk.sent_at;
      }

      completedMessage.content += chunk.content;
      completedMessage.reasoning += chunk.reasoning;
      completedMessage.status = chunk.status;
    }
  } catch (error: any) {
    // If the error is about not receiving done/success response, we can ignore it
    // as we've received all chunks successfully
    if (
      !error.message?.includes(
        "Did not receive done or success response in stream",
      )
    ) {
      throw error;
    }
  } finally {
    onDone?.();
  }

  return completedMessage;
}

/**
 * Creates a temporary message object for immediate display
 */
const createTempMessage = (role: MessageRole, content: string = "") => {
  return {
    id: Math.random(),
    chat_thread_id: 0,
    role,
    content,
    reasoning: "",
    llm: "",
    status: role === "assistant" ? "idle" : undefined,
    sent_at: new Date().toISOString(),
  } as Message;
};

interface UseChatParams {
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
}

interface UseChatOptions {
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
}

/**
 * Hook for managing chat interactions including message sending and streaming
 */
export const useChat = (
  { messages, setMessages }: UseChatParams,
  options?: UseChatOptions,
) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [stopRequested, setStopRequested] = useState(false);

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
      await sendMessage(
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
