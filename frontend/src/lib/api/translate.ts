import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";

import { ApiResponse } from ".";
import { fetchApi, PaginatedApiResponse } from ".";

export interface TranslateProject {
  id: number;
  title: string;
  ai_model: string;
  created_at: string;
  updated_at: string;
}

export interface TranslateMessage {
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

export const useTranslateProjects = (
  options?: UseQueryOptions<PaginatedApiResponse<TranslateProject>, Error>,
) => {
  return useQuery({
    queryKey: ["translate-projects"],
    queryFn: () =>
      fetchApi<PaginatedApiResponse<TranslateProject>>("/translate-projects"),
    ...options,
  });
};

export const getTranslateProjectMessagesQueryKey = (id: number) => [
  "translate-project-messages",
  id,
];

export const useTranslateProjectMessages = (
  id: number,
  options?: Partial<
    UseQueryOptions<PaginatedApiResponse<TranslateMessage>, Error>
  >,
) => {
  return useQuery({
    queryKey: getTranslateProjectMessagesQueryKey(id),
    queryFn: () =>
      fetchApi<PaginatedApiResponse<TranslateMessage>>(
        `/translate-projects/${id}/messages`,
      ),
    ...options,
  });
};

export const useCreateTranslateProject = (
  options?: UseMutationOptions<ApiResponse<TranslateProject>, Error, string>,
) => {
  return useMutation({
    mutationFn: (title: string) =>
      fetchApi<ApiResponse<TranslateProject>>("/translate-projects", {
        method: "POST",
        body: JSON.stringify({ title }),
      }),
    ...options,
  });
};

export const useUpdateTranslateThread = (
  options?: UseMutationOptions<
    ApiResponse<TranslateProject>,
    Error,
    { id: number; title: string }
  >,
) => {
  return useMutation({
    mutationFn: ({ id, title }) =>
      fetchApi<ApiResponse<TranslateProject>>(`/translate-projects/${id}`, {
        method: "PUT",
        body: JSON.stringify({ title }),
      }),
    ...options,
  });
};

export const useDeleteTranslateProject = (
  options?: UseMutationOptions<ApiResponse<TranslateProject>, Error, number>,
) => {
  return useMutation({
    mutationFn: (id: number) =>
      fetchApi<ApiResponse<TranslateProject>>(`/translate-projects/${id}`, {
        method: "DELETE",
      }),
    ...options,
  });
};

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
  translateProjectId: number,
  request: TranslateRequest,
) {
  const response = await fetchApi<ApiResponse<TranslateMessage>>(`/translate`, {
    method: "POST",
    body: JSON.stringify({
      ...request,
      project_id: translateProjectId.toString(),
    }),
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
