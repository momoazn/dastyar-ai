import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { ApiResponse, fetchApi } from ".";
import { defaultQueryOptions } from "./common";

/**
 * React Query hook for checking the health status of the chat service
 */
export const useChatHealthCheck = (
  options?: UseQueryOptions<ApiResponse<string>, Error>,
) => {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => fetchApi<ApiResponse<string>>("/health"),
    refetchInterval: 10000,
    ...defaultQueryOptions,
    ...options,
  });
};
