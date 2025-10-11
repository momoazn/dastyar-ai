import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client, orpc } from "@/utils/orpc";

export type ListMutationsConfig = {
  listQueryKey: readonly unknown[];
  refetchOnSuccess?: boolean;
};

export interface DeleteMutationConfig extends ListMutationsConfig {
  deleteFn: (id: number) => Promise<unknown>;
}

export interface ArchiveMutationConfig extends ListMutationsConfig {
  archiveFn: (id: number) => Promise<unknown>;
}

export interface RenameMutationConfig extends ListMutationsConfig {
  renameFn: (id: number, title: string) => Promise<unknown>;
}

export function useDeleteMutation({
  listQueryKey,
  deleteFn,
  refetchOnSuccess = true,
}: DeleteMutationConfig) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFn,
    onSuccess: async () => {
      if (refetchOnSuccess) {
        await queryClient.invalidateQueries({
          queryKey: listQueryKey,
        });
      }
    },
  });
}

export function useArchiveMutation({
  listQueryKey,
  archiveFn,
  refetchOnSuccess = true,
}: ArchiveMutationConfig) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archiveFn,
    onSuccess: async () => {
      if (refetchOnSuccess) {
        await queryClient.invalidateQueries({
          queryKey: listQueryKey,
        });
      }
    },
  });
}

export function useRenameMutation({
  listQueryKey,
  renameFn,
  refetchOnSuccess = true,
}: RenameMutationConfig) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) =>
      renameFn(id, title),
    onSuccess: async () => {
      if (refetchOnSuccess) {
        await queryClient.invalidateQueries({
          queryKey: listQueryKey,
        });
      }
    },
  });
}

// Pre-configured mutations for common entities
export function useThreadMutations() {
  return {
    delete: useDeleteMutation({
      listQueryKey: orpc.threads.list.queryKey(),
      deleteFn: (id: number) => client.threads.delete({ id }),
    }),
    archive: useArchiveMutation({
      listQueryKey: orpc.threads.list.queryKey(),
      archiveFn: (id: number) => client.threads.archive({ id }),
    }),
    rename: useRenameMutation({
      listQueryKey: orpc.threads.list.queryKey(),
      renameFn: (id: number, title: string) =>
        client.threads.rename({ id, title }),
    }),
  };
}

export function useSummaryMutations() {
  return {
    delete: useDeleteMutation({
      listQueryKey: orpc.summarize.list.queryKey(),
      deleteFn: (id: number) => client.summarize.delete({ id }),
    }),
  };
}

export function useTranslationMutations() {
  return {
    delete: useDeleteMutation({
      listQueryKey: orpc.translations.list.queryKey(),
      deleteFn: (id: number) => client.translations.delete({ id }),
    }),
  };
}

export function useImageThreadMutations() {
  return {
    delete: useDeleteMutation({
      listQueryKey: orpc.imageThreads.list.queryKey(),
      deleteFn: (id: number) => client.imageThreads.delete({ id }),
    }),
    archive: useArchiveMutation({
      listQueryKey: orpc.imageThreads.list.queryKey(),
      archiveFn: (id: number) => client.imageThreads.archive({ id }),
    }),
    rename: useRenameMutation({
      listQueryKey: orpc.imageThreads.list.queryKey(),
      renameFn: (id: number, title: string) =>
        client.imageThreads.rename({ id, title }),
    }),
  };
}
