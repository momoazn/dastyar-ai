import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { orpc } from "@/utils/orpc";

export function useImageThreads() {
  const list = useQuery(orpc.imageThreads.list.queryOptions());

  const create = useMutation(
    orpc.imageThreads.create.mutationOptions({
      onSuccess: () => {
        list.refetch();
        toast.success("گفتگوی تصویری جدید ایجاد شد");
      },
      onError: () => {
        toast.error("خطا در ایجاد گفتگوی تصویری");
      },
    })
  );

  const rename = useMutation(
    orpc.imageThreads.rename.mutationOptions({
      onSuccess: () => {
        list.refetch();
        toast.success("عنوان گفتگو تغییر کرد");
      },
      onError: () => {
        toast.error("خطا در تغییر عنوان گفتگو");
      },
    })
  );

  const archive = useMutation(
    orpc.imageThreads.archive.mutationOptions({
      onSuccess: () => {
        list.refetch();
        toast.success("گفتگو بایگانی شد");
      },
      onError: () => {
        toast.error("خطا در بایگانی گفتگو");
      },
    })
  );

  const del = useMutation(
    orpc.imageThreads.delete.mutationOptions({
      onSuccess: () => {
        list.refetch();
        toast.success("گفتگو حذف شد");
      },
      onError: () => {
        toast.error("خطا در حذف گفتگو");
      },
    })
  );

  return { list, create, rename, archive, del };
}
