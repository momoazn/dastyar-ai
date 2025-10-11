import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { orpc } from "@/utils/orpc";

export function useImageThreads() {
  const queryClient = useQueryClient();

  const list = useQuery(orpc.imageThreads.list.queryOptions());

  const create = useMutation({
    ...orpc.imageThreads.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.imageThreads.list.queryKey(),
        });
        toast.success("گفتگوی تصویری جدید ایجاد شد");
      },
      onError: (error) => {
        console.error("Failed to create image thread:", error);
        toast.error("خطا در ایجاد گفتگوی تصویری");
      },
    }),
  });

  const rename = useMutation({
    ...orpc.imageThreads.rename.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.imageThreads.list.queryKey(),
        });
        toast.success("عنوان گفتگو تغییر کرد");
      },
      onError: (error) => {
        console.error("Failed to rename image thread:", error);
        toast.error("خطا در تغییر عنوان گفتگو");
      },
    }),
  });

  const archive = useMutation({
    ...orpc.imageThreads.archive.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.imageThreads.list.queryKey(),
        });
        toast.success("گفتگو بایگانی شد");
      },
      onError: (error) => {
        console.error("Failed to archive image thread:", error);
        toast.error("خطا در بایگانی گفتگو");
      },
    }),
  });

  const del = useMutation({
    ...orpc.imageThreads.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.imageThreads.list.queryKey(),
        });
        toast.success("گفتگو حذف شد");
      },
      onError: (error) => {
        console.error("Failed to delete image thread:", error);
        toast.error("خطا در حذف گفتگو");
      },
    }),
  });

  return { list, create, rename, archive, del };
}
