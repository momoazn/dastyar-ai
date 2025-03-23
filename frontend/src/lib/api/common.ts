import { ApiResponse, PaginatedApiResponse } from ".";

/**
 * Handles API errors consistently across the application
 */
export function handleApiError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error('Unknown API error occurred');
}

/**
 * Transforms a successful response for consistent handling
 */
export function transformResponse<T>(data: T): ApiResponse<T> {
  return {
    data,
    message: 'Success',
  };
}

/**
 * Transforms a paginated response
 */
export function transformPaginatedResponse<T>(
  data: T[],
  hasNext = false,
  hasPrevious = false
): PaginatedApiResponse<T> {
  return {
    data,
    message: 'Success',
    has_next: hasNext,
    has_previous: hasPrevious,
  };
}

/**
 * Default query options that can be used across the application
 */
export const defaultQueryOptions = {
  retry: 1,
  refetchOnWindowFocus: false,
  staleTime: 5 * 60 * 1000, // 5 minutes
}; 