import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";

import { ApiResponse, fetchApi, PaginatedApiResponse } from ".";
import { defaultQueryOptions } from "./common";

// Type definitions
export interface TranslationThread {
  id: number;
  title: string;
  llm: string;
  created_at: string;
  updated_at: string;
}

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
export const getTranslationThreadsQueryKey = () => ["translation-threads"];
export const getTranslationThreadTranslationsQueryKey = (
  translationThreadId: number,
) => ["translation-thread-translations", translationThreadId];

// React Query hooks - Queries
export const useTranslationThreads = (
  options?: Partial<
    UseQueryOptions<PaginatedApiResponse<TranslationThread>, Error>
  >,
) => {
  return useQuery({
    queryKey: getTranslationThreadsQueryKey(),
    queryFn: () =>
      fetchApi<PaginatedApiResponse<TranslationThread>>("/translation-threads"),
    retry: defaultQueryOptions.retry,
    refetchOnWindowFocus: defaultQueryOptions.refetchOnWindowFocus,
    staleTime: defaultQueryOptions.staleTime,
    ...options,
  });
};

export const useTranslationThreadTranslations = (
  id: number,
  options?: Partial<UseQueryOptions<PaginatedApiResponse<Translation>, Error>>,
) => {
  return useQuery({
    queryKey: getTranslationThreadTranslationsQueryKey(id),
    queryFn: () =>
      fetchApi<PaginatedApiResponse<Translation>>(
        `/translation-threads/${id}/translations`,
      ),
    retry: defaultQueryOptions.retry,
    refetchOnWindowFocus: defaultQueryOptions.refetchOnWindowFocus,
    staleTime: defaultQueryOptions.staleTime,
    ...options,
  });
};

// React Query hooks - Mutations
export const useCreateTranslationThread = (
  options?: UseMutationOptions<
    ApiResponse<TranslationThread>,
    Error,
    { title: string }
  >,
) => {
  return useMutation({
    mutationFn: ({ title }) =>
      fetchApi<ApiResponse<TranslationThread>>("/translation-threads", {
        method: "POST",
        body: JSON.stringify({ title }),
      }),
    ...options,
  });
};

export const useUpdateTranslationThread = (
  options?: UseMutationOptions<
    ApiResponse<TranslationThread>,
    Error,
    { id: number; title: string }
  >,
) => {
  return useMutation({
    mutationFn: ({ id, title }) =>
      fetchApi<ApiResponse<TranslationThread>>(`/translation-threads/${id}`, {
        method: "PUT",
        body: JSON.stringify({ title }),
      }),
    ...options,
  });
};

export const useDeleteTranslationThread = (
  options?: UseMutationOptions<
    ApiResponse<TranslationThread>,
    Error,
    { id: number }
  >,
) => {
  return useMutation({
    mutationFn: ({ id }) =>
      fetchApi<ApiResponse<TranslationThread>>(`/translation-threads/${id}`, {
        method: "DELETE",
      }),
    ...options,
  });
};

// Direct API functions
export async function translate(
  translationThreadId: number,
  request: TranslateRequest,
) {
  const response = await fetchApi<ApiResponse<Translation>>(`/translate`, {
    method: "POST",
    body: JSON.stringify({
      ...request,
      translation_thread_id: translationThreadId,
    }),
  });

  return response.data;
}
