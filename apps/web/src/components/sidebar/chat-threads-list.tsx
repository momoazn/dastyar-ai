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

  const redirectToChat = (id: string) => {
    if (location.pathname === `/chat/${id}`) {
      navigate({ to: '/chat' });
    }
  };

  const handleArchive = (id: string) => {
    mutations.archive.mutate(id);
    redirectToChat(id);
  };

  const handleDelete = (id: string) => {
    mutations.delete.mutate(id);
    redirectToChat(id);
  };

  const handleRename = async (id: string, title: string) => {
    await mutations.rename.mutateAsync({ id, title });
  };

  const listQuery = useQuery({
    ...orpc.threads.list.queryOptions({ includeArchived: false }),
    enabled: isChatPage,
  });

  const editingState = useEditingState(
    (listQuery.data as { id: string; title?: string }[]) || [],
    handleRename
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
              icon: null as never,
            },
            {
              type: 'archive',
              onClick: () => handleArchive(thread.id),
              title: 'بایگانی',
              icon: null as never,
            },
            {
              type: 'delete',
              onClick: () => handleDelete(thread.id),
              title: 'حذف',
              icon: null as never,
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
          params={{ id: thread.id }}
          title={thread.title || 'بدون عنوان'}
          to="/chat/$id"
        />
      ))}
    </>
  );
}
