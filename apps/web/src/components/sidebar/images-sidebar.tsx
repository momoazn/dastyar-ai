import { useQuery } from '@tanstack/react-query';
import { useLocation } from '@tanstack/react-router';
import type { GeneratedImage } from '@/hooks/use-image-generation';
import { orpc } from '@/utils/orpc';
import { SidebarItem, useImageMutations } from './base';
import { ImageEmptyState } from './empty-state';

export function ImagesSidebar() {
  const location = useLocation();
  const isImagePage = location.pathname.startsWith('/image');

  const mutations = useImageMutations();

  const handleDelete = (id: string) => {
    mutations.delete.mutate(id);
  };

  const handleDownload = (id: string, fileName: string) => {
    try {
      const baseUrl =
        import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
      const downloadUrl = `${baseUrl}/api/images/${id}/download`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  const listQuery = useQuery({
    ...orpc.images.list.queryOptions(),
    enabled: isImagePage,
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fa-IR', {
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
      <div className="space-y-0.5">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            className="h-12 animate-pulse rounded-md bg-sidebar-accent/50"
            key={`image-sidebar-loading-${
              // biome-ignore lint/suspicious/noArrayIndexKey: go
              i
            }`}
          />
        ))}
      </div>
    );
  }

  const images = Array.isArray(listQuery.data)
    ? (listQuery.data as unknown as GeneratedImage[])
    : [];

  if (!images.length) {
    return <ImageEmptyState />;
  }

  return (
    <>
      {images.map((image: GeneratedImage) => (
        <SidebarItem
          actions={[
            {
              type: 'download',
              onClick: () => handleDownload(image.id, `image-${image.id}.png`),
              title: 'دانلود',
              icon: null as never,
            },
            {
              type: 'delete',
              onClick: () => handleDelete(image.id),
              title: 'حذف',
              icon: null as never,
            },
          ]}
          date={formatDate(image.createdAt as string)}
          iconText={image.prompt.substring(0, 2).toUpperCase()}
          key={image.id}
          params={{ id: image.id }}
          subtitle={
            image.prompt.slice(0, 10) + (image.prompt.length > 10 ? '...' : '')
          }
          title={
            image.prompt.slice(0, 30) + (image.prompt.length > 30 ? '...' : '')
          }
          to="/image/$id"
        />
      ))}
    </>
  );
}
