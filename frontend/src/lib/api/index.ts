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
