import { useLocation } from "@tanstack/react-router";
import { useImageThreads } from "@/hooks/use-image-threads";
import { fa } from "@/lib/persian-texts";
import { orpc } from "@/utils/orpc";
import { SidebarItem, useSidebarList } from "./base";
import { ImageEmptyState } from "./empty-state";

export function ImagesSidebar() {
  const location = useLocation();
  const isImagePage = location.pathname.startsWith("/image");

  const { del } = useImageThreads();

  const handleDelete = (id: number) => {
    del.mutate({ id });
  };

  const listResult = useSidebarList({
    queryOptions: orpc.imageThreads.list.queryOptions(),
    enabled: isImagePage,
    emptyState: <ImageEmptyState />,
    loadingMessage: fa.general.loadingWithEllipsis,
  });

  const formatDate = (dateOrStr: string | Date | null) => {
    if (!dateOrStr) {
      return "";
    }
    const d = typeof dateOrStr === "string" ? new Date(dateOrStr) : dateOrStr;
    return d.toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isImagePage) {
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
      {listResult.data.map((thread) => (
        <SidebarItem
          actions={[
            {
              type: "delete",
              onClick: () => handleDelete(thread.id),
              title: fa.sidebar.actions.delete,
            },
          ]}
          date={formatDate(thread.lastImageAt ?? thread.updatedAt)}
          iconText={thread.title.substring(0, 2).toUpperCase()}
          key={thread.id}
          params={{ id: thread.id.toString() }}
          subtitle=""
          title={thread.title}
          to="/image/$id"
        />
      ))}
    </>
  );
}
