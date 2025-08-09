import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { PERSIAN_TEXTS } from '@/lib/persian-texts';
import { client, orpc } from '@/utils/orpc';
import { SidebarItem } from './sidebar-item';

export function ChatThreadsList() {
  const location = useLocation();
  const navigate = useNavigate();

  const listQuery = useQuery(
    orpc.threads.list.queryOptions({ includeArchived: false })
  );

  const deleteMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => client.threads.delete({ id }),
    onSuccess: async () => {
      await listQuery.refetch();
    },
  });

  const archiveMutation = useMutation({
    mutationFn: ({ id, isArchived }: { id: string; isArchived: boolean }) =>
      client.threads.archive({ id, isArchived }),
    onSuccess: async () => {
      await listQuery.refetch();
    },
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate({ id });
    if (location.pathname === `/chat/${id}`) {
      navigate({ to: '/chat' });
    }
  };

  return (
    <>
      {listQuery.isPending && (
        <div className="mt-4 flex h-full items-center justify-center">
          <p className="text-muted-foreground text-sm">
            {PERSIAN_TEXTS.navigation.loadingThreads}
          </p>
        </div>
      )}
      {listQuery.data?.length === 0 && (
        <div className="mt-4 flex h-full items-center justify-center">
          <p className="text-muted-foreground text-sm">
            {PERSIAN_TEXTS.navigation.noChatThreads}
          </p>
        </div>
      )}
      {listQuery.data?.map((thread) => (
        <SidebarItem
          key={thread.id}
          onArchive={() =>
            archiveMutation.mutate({
              id: thread.id,
              isArchived: !thread.isArchived,
            })
          }
          onDelete={() => handleDelete(thread.id)}
          title={thread.title}
          to={`/chat/${thread.id}`}
        />
      ))}
    </>
  );
}
