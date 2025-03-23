import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";

import { ApiResponse, fetchApi, PaginatedApiResponse } from ".";
import { defaultQueryOptions } from "./common";

// Type definitions
export interface TranslationProject {
  id: number;
  title: string;
  ai_model: string;
  created_at: string;
  updated_at: string;
}

export interface Translation {
  id: number;
  project_id: number;
  source_text: string;
  translated_text: string;
  ai_model: string;
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

export type TranslateRequest = {
  input: string;
  model: string;
} & TranslationOptions;

// Query key getters
export const getTranslationProjectsQueryKey = () => ["translation-projects"];
export const getTranslationProjectTranslationsQueryKey = (id: number) => [
  "translate-project-translations",
  id,
];

// React Query hooks - Queries
export const useTranslationProjects = (
  options?: Partial<
    UseQueryOptions<PaginatedApiResponse<TranslationProject>, Error>
  >,
) => {
  return useQuery({
    queryKey: getTranslationProjectsQueryKey(),
    queryFn: () =>
      fetchApi<PaginatedApiResponse<TranslationProject>>(
        "/translation-projects",
      ),
    retry: defaultQueryOptions.retry,
    refetchOnWindowFocus: defaultQueryOptions.refetchOnWindowFocus,
    staleTime: defaultQueryOptions.staleTime,
    ...options,
  });
};

export const useTranslationProjectTranslations = (
  id: number,
  options?: Partial<UseQueryOptions<PaginatedApiResponse<Translation>, Error>>,
) => {
  return useQuery({
    queryKey: getTranslationProjectTranslationsQueryKey(id),
    queryFn: () =>
      fetchApi<PaginatedApiResponse<Translation>>(
        `/translation-projects/${id}/translations`,
      ),
    retry: defaultQueryOptions.retry,
    refetchOnWindowFocus: defaultQueryOptions.refetchOnWindowFocus,
    staleTime: defaultQueryOptions.staleTime,
    ...options,
  });
};

// React Query hooks - Mutations
export const useCreateTranslationProject = (
  options?: UseMutationOptions<
    ApiResponse<TranslationProject>,
    Error,
    { title: string }
  >,
) => {
  return useMutation({
    mutationFn: ({ title }) =>
      fetchApi<ApiResponse<TranslationProject>>("/translation-projects", {
        method: "POST",
        body: JSON.stringify({ title }),
      }),
    ...options,
  });
};

export const useUpdateTranslationProject = (
  options?: UseMutationOptions<
    ApiResponse<TranslationProject>,
    Error,
    { id: number; title: string }
  >,
) => {
  return useMutation({
    mutationFn: ({ id, title }) =>
      fetchApi<ApiResponse<TranslationProject>>(`/translation-projects/${id}`, {
        method: "PUT",
        body: JSON.stringify({ title }),
      }),
    ...options,
  });
};

export const useDeleteTranslationProject = (
  options?: UseMutationOptions<
    ApiResponse<TranslationProject>,
    Error,
    { id: number }
  >,
) => {
  return useMutation({
    mutationFn: ({ id }) =>
      fetchApi<ApiResponse<TranslationProject>>(`/translation-projects/${id}`, {
        method: "DELETE",
      }),
    ...options,
  });
};

// Direct API functions
export async function translate(projectId: number, request: TranslateRequest) {
  const response = await fetchApi<ApiResponse<Translation>>(`/translate`, {
    method: "POST",
    body: JSON.stringify({
      ...request,
      project_id: projectId.toString(),
    }),
  });

  return response.data;
}
