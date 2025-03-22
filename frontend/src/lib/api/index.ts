import { useQuery, UseQueryOptions } from "@tanstack/react-query";

export type ApiResponse<T> = {
  data: T;
  message: string;
};

export type PaginatedApiResponse<T> = {
  data: T[];
  message: string;
  has_next: boolean;
  has_previous: boolean;
};

export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`/api${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${endpoint}`);
  }

  return options?.method === "DELETE" ? undefined : response.json();
}

export type AIModel = {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
};

export const useAIModels = (
  options?: UseQueryOptions<ApiResponse<AIModel[]>, Error>,
) => {
  return useQuery({
    queryKey: ["models"],
    queryFn: () => fetchApi<ApiResponse<AIModel[]>>("/models"),
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
