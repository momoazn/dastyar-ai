import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client, orpc } from '@/utils/orpc';

export interface ListMutationsConfig {
  listQueryKey: string[];
  refetchOnSuccess?: boolean;
}

export interface DeleteMutationConfig extends ListMutationsConfig {
  deleteFn: (id: string) => Promise<void>;
}

export interface ArchiveMutationConfig extends ListMutationsConfig {
  archiveFn: (id: string) => Promise<void>;
}

export interface RenameMutationConfig extends ListMutationsConfig {
  renameFn: (id: string, title: string) => Promise<void>;
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
    mutationFn: ({ id, title }: { id: string; title: string }) =>
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
      deleteFn: (id: string) => client.threads.delete({ id }),
    }),
    archive: useArchiveMutation({
      listQueryKey: orpc.threads.list.queryKey(),
      archiveFn: (id: string) => client.threads.archive({ id }),
    }),
    rename: useRenameMutation({
      listQueryKey: orpc.threads.list.queryKey(),
      renameFn: (id: string, title: string) =>
        client.threads.rename({ id, title }),
    }),
  };
}

export function useSummaryMutations() {
  return {
    delete: useDeleteMutation({
      listQueryKey: orpc.summarize.list.queryKey(),
      deleteFn: (id: string) => client.summarize.delete({ id }),
    }),
  };
}

export function useTranslationMutations() {
  return {
    delete: useDeleteMutation({
      listQueryKey: orpc.translations.list.queryKey(),
      deleteFn: (id: string) => client.translations.delete({ id }),
    }),
  };
}

export function useImageMutations() {
  return {
    delete: useDeleteMutation({
      listQueryKey: orpc.images.list.queryKey(),
      deleteFn: (id: string) => client.images.delete({ id }),
    }),
  };
}
