import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { client, orpc, queryClient } from "@/utils/orpc";

export function useCreateThread(isActive: boolean) {
  const navigate = useNavigate();

  const listQuery = useQuery({
    ...orpc.threads.list.queryOptions({ includeArchived: false }),
    enabled: isActive,
  });

  const createMutation = useMutation({
    mutationFn: (title?: string) => client.threads.create({ title }),
    onSuccess: (res) => {
      queryClient.invalidateQueries();
      navigate({ to: "/chat/$id", params: { id: res.id.toString() } });
    },
  });

  return {
    createChatThread: () => createMutation.mutate(undefined),
    listQuery,
  } as const;
}

export function useTranslationActions() {
  const navigate = useNavigate();
  return {
    handleNewTranslation: () => navigate({ to: "/translations" }),
  } as const;
}
