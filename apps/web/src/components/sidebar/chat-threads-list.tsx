import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { PERSIAN_TEXTS } from '@/lib/persian-texts';
import { client, orpc } from '@/utils/orpc';
import { SidebarItem } from './sidebar-item';

export function ChatThreadsList() {
  const location = useLocation();
  const navigate = useNavigate();

  const isChatPage = location.pathname.startsWith('/chat');

  const listQuery = useQuery(
    orpc.threads.list.queryOptions({
      includeArchived: false,
      enabled: isChatPage,
    })
  );

  const deleteMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => client.threads.delete({ id }),
    onSuccess: async () => {
      await listQuery.refetch();
    },
  });

  const archiveMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => client.threads.archive({ id }),
    onSuccess: async () => {
      await listQuery.refetch();
    },
  });

  const handleArchive = (id: string) => {
    archiveMutation.mutate({ id });
    redirectToChat(id);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate({ id });
    redirectToChat(id);
  };

  const redirectToChat = (id: string) => {
    if (location.pathname === `/chat/${id}`) {
      navigate({ to: '/chat' });
    }
  };

  if (!isChatPage) {
    return null;
  }

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
          onArchive={() => handleArchive(thread.id)}
          onDelete={() => handleDelete(thread.id)}
          title={thread.title}
          to={`/chat/${thread.id}`}
        />
      ))}
    </>
  );
}
