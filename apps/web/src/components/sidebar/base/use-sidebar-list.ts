import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { SidebarLoadingState } from "./sidebar-loading-state";

type UseSidebarListConfig<T> = {
  queryOptions: UseQueryOptions<T[], Error, T[], readonly unknown[]>;
  enabled: boolean;
  emptyState: ReactNode;
  loadingMessage?: string;
};

type UseSidebarListResult<T> = {
  data: T[] | null;
  isLoading: boolean;
  isEmpty: boolean;
  loadingComponent?: ReactNode;
  emptyComponent?: ReactNode | null;
};

export function useSidebarList<T>({
  queryOptions,
  enabled,
  emptyState,
  loadingMessage,
}: UseSidebarListConfig<T>): UseSidebarListResult<T> {
  const query = useQuery({
    ...queryOptions,
    enabled: enabled && queryOptions.enabled !== false,
  } as UseQueryOptions<T[], Error, T[], readonly unknown[]>);

  if (!enabled) {
    return { data: null, isLoading: false, isEmpty: false };
  }

  if (query.isPending) {
    return {
      data: null,
      isLoading: true,
      isEmpty: false,
      loadingComponent: createElement(SidebarLoadingState, {
        message: loadingMessage,
      }),
    };
  }

  const isEmpty = !query.data || query.data.length === 0;

  return {
    data: query.data ?? null,
    isLoading: query.isPending,
    isEmpty,
    emptyComponent: isEmpty ? emptyState : null,
  };
}
