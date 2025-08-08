import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { PERSIAN_TEXTS } from '@/lib/persian-texts';
import { client, orpc, queryClient } from '@/utils/orpc';
import { SidebarItem } from './sidebar-item';

export function ChatThreadsList() {
  const navigate = useNavigate();

  const listQuery = useQuery(
    orpc.threads.list.queryOptions({ includeArchived: false })
  );

  const deleteMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => client.threads.delete({ id }),
    onSuccess: () => void queryClient.invalidateQueries(),
  });

  const archiveMutation = useMutation({
    mutationFn: ({ id, isArchived }: { id: string; isArchived: boolean }) =>
      client.threads.archive({ id, isArchived }),
    onSuccess: () => void queryClient.invalidateQueries(),
  });

  const items = (listQuery.data ?? []).map((t: any) => ({
    id: t.id as string,
    title: t.title as string,
    isArchived: Boolean(t.isArchived),
  }));

  return (
    <>
      {items.length === 0 && (
        <div className="mt-4 flex h-full items-center justify-center">
          <p className="text-muted-foreground text-sm">
            {PERSIAN_TEXTS.navigation.noChatThreads}
          </p>
        </div>
      )}
      {items.map((thread) => (
        <SidebarItem
          key={thread.id}
          onArchive={() =>
            archiveMutation.mutate({
              id: thread.id,
              isArchived: !thread.isArchived,
            })
          }
          onDelete={() => {
            deleteMutation.mutate({ id: thread.id });
            navigate({ to: '/chat' });
          }}
          title={thread.title}
          to={`/chat/${thread.id}`}
        />
      ))}
    </>
  );
}
