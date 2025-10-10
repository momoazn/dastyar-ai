import { useQuery } from '@tanstack/react-query';
import { useLocation } from '@tanstack/react-router';
import { orpc } from '@/utils/orpc';
import { SidebarItem, useImageThreadMutations } from './base';
import { ImageEmptyState } from './empty-state';

export function ImagesSidebar() {
  const location = useLocation();
  const isImagePage = location.pathname.startsWith('/image');

  const mutations = useImageThreadMutations();

  const handleDelete = (id: number) => {
    mutations.delete.mutate(id);
  };

  const listQuery = useQuery({
    ...orpc.imageThreads.list.queryOptions(),
    enabled: isImagePage,
  });

  const formatDate = (dateOrStr: string | Date | null) => {
    if (!dateOrStr) {
      return '';
    }
    const d = typeof dateOrStr === 'string' ? new Date(dateOrStr) : dateOrStr;
    return d.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isImagePage) {
    return null;
  }

  if (listQuery.isLoading) {
    return (
      <div className="mt-4 flex h-full items-center justify-center">
        <p className="text-muted-foreground text-sm">در حال بارگذاری...</p>
      </div>
    );
  }

  const threads = Array.isArray(listQuery.data) ? listQuery.data : [];

  if (!threads.length) {
    return <ImageEmptyState />;
  }

  return (
    <>
      {threads.map((thread) => (
        <SidebarItem
          actions={[
            {
              type: 'delete',
              onClick: () => handleDelete(thread.id),
              title: 'حذف',
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
