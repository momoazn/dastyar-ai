import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";

import { ApiResponse, fetchApi, PaginatedApiResponse } from ".";
import { StreamResponseService } from "../utils";
import { defaultQueryOptions } from "./common";

// Type definitions
export type MessageStatus = "idle" | "reasoning" | "responding" | "done";
export type MessageRole = "user" | "assistant" | "system";

export interface Conversation {
  id: number;
  title: string;
  ai_model: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  role: MessageRole;
  content: string;
  reasoning: string;
  ai_model: string;
  status: MessageStatus;
  sent_at: string;
}

// Query key getters
export const getConversationsQueryKey = () => ["conversations"];
export const getConversationMessagesQueryKey = (id: number) => [
  "conversation-messages",
  id,
];

// React Query hooks - Queries
export const useConversations = (
  options?: UseQueryOptions<PaginatedApiResponse<Conversation>, Error>,
) => {
  return useQuery({
    queryKey: getConversationsQueryKey(),
    queryFn: () =>
      fetchApi<PaginatedApiResponse<Conversation>>("/conversations"),
    retry: defaultQueryOptions.retry,
    refetchOnWindowFocus: defaultQueryOptions.refetchOnWindowFocus,
    staleTime: defaultQueryOptions.staleTime,
    ...options,
  });
};

export const useConversationMessages = (
  id: number,
  options?: Partial<UseQueryOptions<PaginatedApiResponse<Message>, Error>>,
) => {
  return useQuery({
    queryKey: getConversationMessagesQueryKey(id),
    queryFn: () =>
      fetchApi<PaginatedApiResponse<Message>>(`/conversations/${id}/messages`),
    retry: defaultQueryOptions.retry,
    refetchOnWindowFocus: defaultQueryOptions.refetchOnWindowFocus,
    staleTime: defaultQueryOptions.staleTime,
    ...options,
  });
};

// React Query hooks - Mutations
export const useCreateConversation = (
  options?: UseMutationOptions<ApiResponse<Conversation>, Error, string>,
) => {
  return useMutation({
    mutationFn: (title: string) =>
      fetchApi<ApiResponse<Conversation>>("/conversations", {
        method: "POST",
        body: JSON.stringify({ title }),
      }),
    ...options,
  });
};

export const useUpdateConversation = (
  options?: UseMutationOptions<
    ApiResponse<Conversation>,
    Error,
    { id: number; title: string }
  >,
) => {
  return useMutation({
    mutationFn: ({ id, title }) =>
      fetchApi<ApiResponse<Conversation>>(`/conversations/${id}`, {
        method: "PUT",
        body: JSON.stringify({ title }),
      }),
    ...options,
  });
};

export const useDeleteConversation = (
  options?: UseMutationOptions<ApiResponse<Conversation>, Error, number>,
) => {
  return useMutation({
    mutationFn: (id: number) =>
      fetchApi<ApiResponse<Conversation>>(`/conversations/${id}`, {
        method: "DELETE",
      }),
    ...options,
  });
};

// Direct API functions
export async function sendMessage(
  threadId: number,
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
    thread_id: threadId.toString(),
    stream,
  });

  const completedMessage: Message = {
    id: 0,
    conversation_id: threadId,
    role: "assistant",
    content: "",
    reasoning: "",
    ai_model: model,
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
