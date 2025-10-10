import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { fa } from '@/lib/persian-texts';
import { orpc } from '@/utils/orpc';
import { SidebarItem, useEditingState, useThreadMutations } from './base';
import { ChatEmptyState } from './empty-state';

export function ChatThreadsList() {
  const location = useLocation();
  const navigate = useNavigate();
  const isChatPage = location.pathname.startsWith('/chat');

  const mutations = useThreadMutations();

  const redirectToChat = (id: number) => {
    if (location.pathname === `/chat/${id}`) {
      navigate({ to: '/chat' });
    }
  };

  const handleArchive = (id: number) => {
    mutations.archive.mutate(id);
    redirectToChat(id);
  };

  const handleDelete = (id: number) => {
    mutations.delete.mutate(id);
    redirectToChat(id);
  };

  const handleRename = async (id: number, title: string) => {
    await mutations.rename.mutateAsync({ id, title });
  };

  const listQuery = useQuery({
    ...orpc.threads.list.queryOptions({ includeArchived: false }),
    enabled: isChatPage,
  });

  const editingState = useEditingState(
    (listQuery.data as { id: number | string; title?: string }[]) || [],
    handleRename as (id: number | string, title: string) => Promise<void>
  );

  if (!isChatPage) {
    return null;
  }

  if (listQuery.isPending) {
    return (
      <div className="mt-4 flex h-full items-center justify-center">
        <p className="text-muted-foreground text-sm">
          {fa.navigation.loadingThreads}
        </p>
      </div>
    );
  }

  if (!listQuery.data?.length) {
    return <ChatEmptyState />;
  }

  return (
    <>
      {listQuery.data.map((thread) => (
        <SidebarItem
          actions={[
            {
              type: 'edit',
              onClick: () =>
                editingState.startEditing(thread.id, thread.title || ''),
              title: 'ویرایش',
            },
            {
              type: 'archive',
              onClick: () => handleArchive(thread.id),
              title: 'بایگانی',
            },
            {
              type: 'delete',
              onClick: () => handleDelete(thread.id),
              title: 'حذف',
            },
          ]}
          editingValue={editingState.editingValue}
          isEditing={editingState.isEditing(thread.id)}
          key={thread.id}
          onEditingCancel={editingState.cancelEditing}
          onEditingChange={editingState.setEditingValue}
          onEditingCommit={() =>
            editingState.commitEditing(thread.id, editingState.editingValue)
          }
          params={{ id: thread.id.toString() }}
          title={thread.title || 'بدون عنوان'}
          to="/chat/$id"
        />
      ))}
    </>
  );
}
