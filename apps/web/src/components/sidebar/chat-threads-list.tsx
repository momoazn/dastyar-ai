import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { fa } from '@/lib/persian-texts';
import { client, orpc, queryClient } from '@/utils/orpc';
import { ChatEmptyState } from './empty-state';
import { StandardizedSidebarItem } from './standardized-sidebar-item';

export function ChatThreadsList() {
  const location = useLocation();
  const navigate = useNavigate();

  const isChatPage = location.pathname.startsWith('/chat');

  const listQuery = useQuery(
    orpc.threads.list.queryOptions({
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

  const renameMutation = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      await client.threads.rename({ id, title });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: orpc.threads.list.queryKey(),
      });
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

  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const handleEdit = (threadId: string, currentTitle: string) => {
    setEditingThreadId(threadId);
    setEditingValue(currentTitle || '');
  };

  const handleEditCommit = async (threadId: string) => {
    const newTitle = editingValue.trim();
    if (
      !newTitle ||
      newTitle === (listQuery.data?.find((t) => t.id === threadId)?.title || '')
    ) {
      setEditingThreadId(null);
      setEditingValue('');
      return;
    }

    await renameMutation.mutateAsync({ id: threadId, title: newTitle });
    setEditingThreadId(null);
    setEditingValue('');
  };

  const handleEditCancel = () => {
    setEditingThreadId(null);
    setEditingValue('');
  };

  if (!isChatPage) {
    return null;
  }

  return (
    <>
      {listQuery.isPending && (
        <div className="mt-4 flex h-full items-center justify-center">
          <p className="text-muted-foreground text-sm">
            {fa.navigation.loadingThreads}
          </p>
        </div>
      )}
      {listQuery.data?.length === 0 && <ChatEmptyState />}
      {listQuery.data?.map((thread) => (
        <StandardizedSidebarItem
          editingValue={editingValue}
          isEditing={editingThreadId === thread.id}
          key={thread.id}
          onArchive={() => handleArchive(thread.id)}
          onDelete={() => handleDelete(thread.id)}
          onEdit={() => handleEdit(thread.id, thread.title || '')}
          onEditingCancel={handleEditCancel}
          onEditingChange={setEditingValue}
          onEditingCommit={() => handleEditCommit(thread.id)}
          params={{ id: thread.id }}
          title={thread.title || 'بدون عنوان'}
          to="/chat/$id"
        />
      ))}
    </>
  );
}
