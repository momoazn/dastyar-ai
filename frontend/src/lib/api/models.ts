import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { ApiResponse, fetchApi } from ".";
import { defaultQueryOptions } from "./common";

/**
 * Type definition for AI model information
 */
export type AIModel = {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
};

/**
 * Query key getter for AI models
 */
export const getAIModelsQueryKey = () => ["models"];

/**
 * React Query hook for fetching AI models
 */
export const useAIModels = (
  options?: UseQueryOptions<ApiResponse<AIModel[]>, Error>,
) => {
  return useQuery({
    queryKey: getAIModelsQueryKey(),
    queryFn: () => fetchApi<ApiResponse<AIModel[]>>("/list-llm"),
    ...defaultQueryOptions,
    ...options,
  });
};
