import type { UseQueryOptions } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { fa } from "@/lib/texts";
import { orpc } from "@/utils/orpc";
import {
  SidebarItem,
  useEditingState,
  useSidebarList,
  useThreadMutations,
} from "./base";
import { ChatEmptyState } from "./empty-state";

export function ChatThreadsList() {
  const location = useLocation();
  const navigate = useNavigate();
  const isChatPage = location.pathname.startsWith("/chat");

  const mutations = useThreadMutations();

  const redirectToChat = (id: number) => {
    if (location.pathname === `/chat/${id}`) {
      navigate({ to: "/chat/" });
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

  const listResult = useSidebarList({
    queryOptions: orpc.threads.list.queryOptions({
      includeArchived: false,
    }) as UseQueryOptions<
      { id: number; title?: string }[],
      Error,
      { id: number; title?: string }[],
      readonly unknown[]
    >,
    enabled: isChatPage,
    emptyState: <ChatEmptyState />,
  });

  const editingState = useEditingState(
    (listResult.data as { id: number | string; title?: string }[]) || [],
    handleRename as (id: number | string, title: string) => Promise<void>
  );

  if (!isChatPage) {
    return null;
  }

  if (listResult.isLoading && listResult.loadingComponent) {
    return listResult.loadingComponent;
  }

  if (listResult.isEmpty && listResult.emptyComponent) {
    return listResult.emptyComponent;
  }

  if (!listResult.data) {
    return null;
  }

  return (
    <>
      {(listResult.data as { id: number; title?: string }[]).map((thread) => (
        <SidebarItem
          actions={[
            {
              type: "edit",
              onClick: () =>
                editingState.startEditing(thread.id, thread.title || ""),
              title: fa.sidebar.actions.edit,
            },
            {
              type: "archive",
              onClick: () => handleArchive(thread.id),
              title: fa.sidebar.actions.archive,
            },
            {
              type: "delete",
              onClick: () => handleDelete(thread.id),
              title: fa.sidebar.actions.delete,
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
          title={thread.title || fa.general.untitled}
          to="/chat/$id"
        />
      ))}
    </>
  );
}
