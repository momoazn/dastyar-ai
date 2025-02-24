import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";
import { Config, ErrorResponse, Fetch } from "ollama/browser";
import { ApiResponse, fetchApi, PaginatedApiResponse } from ".";

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

export async function getAllThreads(): Promise<PaginatedApiResponse<Thread>> {
  return fetchApi<PaginatedApiResponse<Thread>>("/threads");
}

export async function getThreadMessages(
  id: number,
): Promise<PaginatedApiResponse<Message>> {
  return fetchApi<PaginatedApiResponse<Message>>(`/threads/${id}/messages`);
}

export async function createThread(
  title: string,
): Promise<ApiResponse<Thread>> {
  return fetchApi<ApiResponse<Thread>>("/threads", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export async function deleteThread(id: number): Promise<ApiResponse<Thread>> {
  return fetchApi<ApiResponse<Thread>>(`/threads/${id}`, {
    method: "DELETE",
  });
}

export type SendMessageBody = {
  content: string;
  model: string;
  stream?: boolean;
  thread_id: string;
};

export async function sendMessage(
  threadId: number,
  content: string,
  model: string,
  onChunk: (chunk: Message) => void,
  onDone: () => void,
): Promise<void> {
  const oll = new Oll();
  const response = await oll.chat({
    content,
    model,
    thread_id: threadId.toString(),
    stream: true,
  });

  try {
    for await (const chunk of response) {
      onChunk(chunk);
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
    onDone();
  }
}

export const useThreads = (
  options?: UseQueryOptions<PaginatedApiResponse<Thread>, Error>,
) => {
  return useQuery({
    queryKey: ["threads"],
    queryFn: getAllThreads,
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
    queryFn: () => getThreadMessages(id),
    ...options,
  });
};

export const useCreateThread = (
  options?: UseMutationOptions<ApiResponse<Thread>, Error, string>,
) => {
  return useMutation({
    mutationFn: createThread,
    ...options,
  });
};

export const useDeleteThread = (
  options?: UseMutationOptions<ApiResponse<Thread>, Error, number>,
) => {
  return useMutation({
    mutationFn: deleteThread,
    ...options,
  });
};

import {
  AbortableAsyncIterator,
  formatHost,
  parseJSON,
  post,
} from "ollama/src/utils.ts";

class Oll {
  protected readonly config: Config;
  protected readonly fetch: Fetch;
  protected readonly ongoingStreamedRequests: AbortableAsyncIterator<object>[] =
    [];

  constructor(config?: Partial<Config>) {
    this.config = {
      host: "",
      headers: config?.headers,
    };

    if (!config?.proxy) {
      this.config.host = formatHost(config?.host ?? "");
    }

    this.fetch = config?.fetch ?? fetch;
  }

  // Abort any ongoing streamed requests to Ollama
  public abort() {
    for (const request of this.ongoingStreamedRequests) {
      request.abort();
    }
    this.ongoingStreamedRequests.length = 0;
  }

  /**
   * Processes a request to the Ollama server. If the request is streamable, it will return a
   * AbortableAsyncIterator that yields the response messages. Otherwise, it will return the response
   * object.
   * @param endpoint {string} - The endpoint to send the request to.
   * @param request {object} - The request object to send to the endpoint.
   * @protected {T | AbortableAsyncIterator<T>} - The response object or a AbortableAsyncIterator that yields
   * response messages.
   * @throws {Error} - If the response body is missing or if the response is an error.
   * @returns {Promise<T | AbortableAsyncIterator<T>>} - The response object or a AbortableAsyncIterator that yields the streamed response.
   */
  protected async processStreamableRequest<T extends object>(
    endpoint: string,
    request: { stream?: boolean } & Record<string, any>,
  ): Promise<AbortableAsyncIterator<T>> {
    request.stream = request.stream ?? false;
    const host = `/api/${endpoint}`;
    if (request.stream) {
      const abortController = new AbortController();
      const response = await post(this.fetch, host, request, {
        signal: abortController.signal,
        headers: this.config.headers,
      });

      if (!response.body) {
        throw new Error("Missing body");
      }

      const itr = parseJSON<T | ErrorResponse>(response.body);
      const abortableAsyncIterator = new AbortableAsyncIterator(
        abortController,
        itr,
        () => {
          const i = this.ongoingStreamedRequests.indexOf(
            abortableAsyncIterator,
          );
          if (i > -1) {
            this.ongoingStreamedRequests.splice(i, 1);
          }
        },
      );
      this.ongoingStreamedRequests.push(abortableAsyncIterator);
      return abortableAsyncIterator;
    }
    const response = await post(this.fetch, host, request, {
      headers: this.config.headers,
    });
    return await response.json();
  }

  /**
   * Chats with the model. The request object can contain messages with images that are either
   * Uint8Arrays or base64 encoded strings. The images will be base64 encoded before sending the
   * request.
   * @param request {ChatRequest} - The request object.
   * @returns {Promise<AbortableAsyncIterator<ChatResponse>>} - The response object or an
   * AbortableAsyncIterator that yields response messages.
   */
  async chat(
    request: SendMessageBody,
  ): Promise<AbortableAsyncIterator<Message>> {
    return this.processStreamableRequest<Message>("chat", request);
  }
}
