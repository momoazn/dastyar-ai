import { useQuery, UseQueryOptions } from "@tanstack/react-query";

import { ApiResponse, fetchApi, PaginatedApiResponse } from ".";
import { defaultQueryOptions } from "./common";

export interface Translation {
  id: number;
  thread_id: number;
  source_text: string;
  translated_text: string;
  llm: string;
  source_language: string;
  target_language: string;
  tone: string;
  created_at: string;
}

export type TranslationOptions = {
  source_lang: string;
  target_lang: string;
  tone: string;
};

export interface TranslateRequest extends TranslationOptions {
  input: string;
  model: string;
}

// Query key getters
export const getTranslationsQueryKey = () => ["translations"];
export const getTranslationQueryKey = (id: string) => ["translation", id];

// React Query hooks - Queries
export const useTranslations = (
  options?: Partial<UseQueryOptions<PaginatedApiResponse<Translation>, Error>>,
) => {
  return useQuery({
    queryKey: getTranslationsQueryKey(),
    queryFn: () => fetchApi<PaginatedApiResponse<Translation>>("/translations"),
    retry: defaultQueryOptions.retry,
    refetchOnWindowFocus: defaultQueryOptions.refetchOnWindowFocus,
    staleTime: defaultQueryOptions.staleTime,
    ...options,
  });
};

export const useTranslation = (
  id: string,
  options?: Partial<UseQueryOptions<Translation, Error>>,
) => {
  return useQuery({
    queryKey: getTranslationQueryKey(id),
    queryFn: () => fetchApi<Translation>(`/translations/${id}`),
    ...defaultQueryOptions,
    ...options,
  });
};

// Direct API functions
export async function translate(request: TranslateRequest) {
  const response = await fetchApi<ApiResponse<Translation>>(`/translate`, {
    method: "POST",
    body: JSON.stringify(request),
  });

  return response.data;
}
