import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { fa } from "@/lib/persian-texts";
import { orpc } from "@/utils/orpc";

export function useImageThreads() {
  const list = useQuery(orpc.imageThreads.list.queryOptions());

  const create = useMutation(
    orpc.imageThreads.create.mutationOptions({
      onSuccess: () => {
        list.refetch();
        toast.success(fa.imageGeneration.threadCreated);
      },
      onError: () => {
        toast.error(fa.imageGeneration.threadCreateError);
      },
    })
  );

  const rename = useMutation(
    orpc.imageThreads.rename.mutationOptions({
      onSuccess: () => {
        list.refetch();
        toast.success(fa.imageGeneration.threadRenamed);
      },
      onError: () => {
        toast.error(fa.imageGeneration.threadRenameError);
      },
    })
  );

  const archive = useMutation(
    orpc.imageThreads.archive.mutationOptions({
      onSuccess: () => {
        list.refetch();
        toast.success(fa.imageGeneration.threadArchived);
      },
      onError: () => {
        toast.error(fa.imageGeneration.threadArchiveError);
      },
    })
  );

  const del = useMutation(
    orpc.imageThreads.delete.mutationOptions({
      onSuccess: () => {
        list.refetch();
        toast.success(fa.imageGeneration.threadDeleted);
      },
      onError: () => {
        toast.error(fa.imageGeneration.threadDeleteError);
      },
    })
  );

  return { list, create, rename, archive, del };
}
