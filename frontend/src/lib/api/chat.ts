import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";
import { ApiResponse, fetchApi, PaginatedApiResponse } from ".";
import { StreamResponseService } from "../utils";

export type Thread = {
  id: number;
  title: string;
  messages: Message[];
  model: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
};

export type Message = {
  id: number;
  thread_id: number;
  role: string;
  content: string;
  think: string;
  model: string;
  state: "idle" | "thinking" | "responding" | "done";
  timestamp: string;
};

export type SendMessageBody = {
  content: string;
  model: string;
  stream?: boolean;
  thread_id: string;
};

export const useThreads = (
  options?: UseQueryOptions<PaginatedApiResponse<Thread>, Error>,
) => {
  return useQuery({
    queryKey: ["threads"],
    queryFn: () => fetchApi<PaginatedApiResponse<Thread>>("/threads"),
    ...options,
  });
};

export const getThreadMessagesQueryKey = (id: number) => [
  "thread-messages",
  id,
];

export const useThreadMessages = (
  id: number,
  options?: UseQueryOptions<PaginatedApiResponse<Message>, Error>,
) => {
  return useQuery({
    queryKey: getThreadMessagesQueryKey(id),
    queryFn: () =>
      fetchApi<PaginatedApiResponse<Message>>(`/threads/${id}/messages`),
    ...options,
  });
};

export const useCreateThread = (
  options?: UseMutationOptions<ApiResponse<Thread>, Error, string>,
) => {
  return useMutation({
    mutationFn: (title: string) =>
      fetchApi<ApiResponse<Thread>>("/threads", {
        method: "POST",
        body: JSON.stringify({ title }),
      }),
    ...options,
  });
};

export const useDeleteThread = (
  options?: UseMutationOptions<ApiResponse<Thread>, Error, number>,
) => {
  return useMutation({
    mutationFn: (id: number) =>
      fetchApi<ApiResponse<Thread>>(`/threads/${id}`, {
        method: "DELETE",
      }),
    ...options,
  });
};

export type ChatModel = {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
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
