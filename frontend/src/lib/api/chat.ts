import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";

import { ApiResponse, fetchApi, PaginatedApiResponse } from ".";
import { StreamResponseService } from "../utils";

export type ChatState = "idle" | "thinking" | "responding" | "done";
export type ChatRole = "user" | "assistant" | "system";

export interface Thread<T extends ChatMessage | TranslateMessage> {
  id: number;
  title: string;
  messages: T[];
  model: string;
  created_at: string;
  updated_at: string;
}

export interface ChatThread extends Thread<ChatMessage> {}
export interface TranslateThread extends Thread<TranslateMessage> {}

export type ChatMessage = {
  id: number;
  thread_id: number;
  role: ChatRole;
  content: string;
  think: string;
  model: string;
  state: ChatState;
  timestamp: string;
};

export type TranslateMessage = {
  id: number;
  thread_id: number;
  input: string;
  output: string;
  model: string;
  source_lang: string;
  target_lang: string;
  tone: string;
  timestamp: string;
};

export type ChatModel = {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
};

export type SendMessageBody = {
  content: string;
  model: string;
  stream?: boolean;
  thread_id: string;
};

export const useChatThreads = (
  options?: UseQueryOptions<PaginatedApiResponse<ChatThread>, Error>,
) => {
  return useQuery({
    queryKey: ["chat-threads"],
    queryFn: () => fetchApi<PaginatedApiResponse<ChatThread>>("/chat-threads"),
    ...options,
  });
};

export const getThreadMessagesQueryKey = (id: number) => [
  "thread-messages",
  id,
];

export const useChatThreadMessages = (
  id: number,
  options?: Partial<UseQueryOptions<PaginatedApiResponse<ChatMessage>, Error>>,
) => {
  return useQuery({
    queryKey: getThreadMessagesQueryKey(id),
    queryFn: () =>
      fetchApi<PaginatedApiResponse<ChatMessage>>(
        `/chat-threads/${id}/messages`,
      ),
    ...options,
  });
};

export const useCreateChatThread = (
  options?: UseMutationOptions<ApiResponse<ChatThread>, Error, string>,
) => {
  return useMutation({
    mutationFn: (title: string) =>
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
    { id: number; title: string }
  >,
) => {
  return useMutation({
    mutationFn: ({ id, title }) =>
      fetchApi<ApiResponse<ChatThread>>(`/chat-threads/${id}`, {
        method: "PUT",
        body: JSON.stringify({ title }),
      }),
    ...options,
  });
};

export const useDeleteChatThread = (
  options?: UseMutationOptions<ApiResponse<ChatThread>, Error, number>,
) => {
  return useMutation({
    mutationFn: (id: number) =>
      fetchApi<ApiResponse<ChatThread>>(`/chat-threads/${id}`, {
        method: "DELETE",
      }),
    ...options,
  });
};

export const useTranslateThreads = (
  options?: UseQueryOptions<PaginatedApiResponse<TranslateThread>, Error>,
) => {
  return useQuery({
    queryKey: ["translate-threads"],
    queryFn: () =>
      fetchApi<PaginatedApiResponse<TranslateThread>>("/translate-threads"),
    ...options,
  });
};

export const getTranslateThreadMessagesQueryKey = (id: number) => [
  "translate-thread-messages",
  id,
];

export const useTranslateThreadMessages = (
  id: number,
  options?: Partial<
    UseQueryOptions<PaginatedApiResponse<TranslateMessage>, Error>
  >,
) => {
  return useQuery({
    queryKey: getTranslateThreadMessagesQueryKey(id),
    queryFn: () =>
      fetchApi<PaginatedApiResponse<TranslateMessage>>(
        `/translate-threads/${id}/messages`,
      ),
    ...options,
  });
};

export const useCreateTranslateThread = (
  options?: UseMutationOptions<ApiResponse<TranslateThread>, Error, string>,
) => {
  return useMutation({
    mutationFn: (title: string) =>
      fetchApi<ApiResponse<TranslateThread>>("/translate-threads", {
        method: "POST",
        body: JSON.stringify({ title }),
      }),
    ...options,
  });
};

export const useUpdateTranslateThread = (
  options?: UseMutationOptions<
    ApiResponse<TranslateThread>,
    Error,
    { id: number; title: string }
  >,
) => {
  return useMutation({
    mutationFn: ({ id, title }) =>
      fetchApi<ApiResponse<TranslateThread>>(`/translate-threads/${id}`, {
        method: "PUT",
        body: JSON.stringify({ title }),
      }),
    ...options,
  });
};

export const useDeleteTranslateThread = (
  options?: UseMutationOptions<ApiResponse<TranslateThread>, Error, number>,
) => {
  return useMutation({
    mutationFn: (id: number) =>
      fetchApi<ApiResponse<TranslateThread>>(`/translate-threads/${id}`, {
        method: "DELETE",
      }),
    ...options,
  });
};

export const useChatModels = (
  options?: UseQueryOptions<ApiResponse<ChatModel[]>, Error>,
) => {
  return useQuery({
    queryKey: ["models"],
    queryFn: () => fetchApi<ApiResponse<ChatModel[]>>("/models"),
    ...options,
  });
};

export const useChatHealthCheck = (
  options?: UseQueryOptions<ApiResponse<string>, Error>,
) => {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => fetchApi<ApiResponse<string>>("/health"),
    refetchInterval: 10000,
    ...options,
  });
};

export async function sendMessage(
  threadId: number,
  content: string,
  model: string,
  stream: boolean,
  onChunk?: (chunk: ChatMessage) => void,
  onDone?: () => void,
): Promise<ChatMessage> {
  const service = new StreamResponseService();

  const response = await service.processStreamableRequest<ChatMessage>("chat", {
    content,
    model,
    thread_id: threadId.toString(),
    stream,
  });

  const completedMessage: ChatMessage = {
    id: 0,
    thread_id: threadId,
    role: "assistant",
    content: "",
    think: "",
    model,
    state: "idle",
    timestamp: "",
  };

  try {
    for await (const chunk of response) {
      onChunk?.(chunk);
      if (completedMessage.id === 0) {
        completedMessage.id = chunk.id;
        completedMessage.timestamp = chunk.timestamp;
      }

      completedMessage.content += chunk.content;
      completedMessage.think += chunk.think;
      completedMessage.state = chunk.state;
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

export type TranslationOptions = {
  source_lang: string;
  target_lang: string;
  tone: string;
};

export type TranslateRequest = {
  input: string;
  model: string;
} & TranslationOptions;

export async function translateMessage(
  threadId: number,
  request: TranslateRequest,
) {
  const response = await fetchApi<ApiResponse<TranslateMessage>>(`/translate`, {
    method: "POST",
    body: JSON.stringify({ ...request, thread_id: threadId.toString() }),
  });

  return response.data;
}

export const useTranslateThreadTranslations = (
  id: number,
  options?: Partial<
    UseQueryOptions<PaginatedApiResponse<TranslateMessage>, Error>
  >,
) => {
  return useQuery({
    queryKey: ["translate-thread-translations", id],
    queryFn: () =>
      fetchApi<PaginatedApiResponse<TranslateMessage>>(
        `/translate-threads/${id}/translations`,
      ),
    ...options,
  });
};
