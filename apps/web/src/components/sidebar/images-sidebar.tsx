import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocation } from '@tanstack/react-router';
import { SidebarSeparator } from '@/components/ui';
import type { GeneratedImage } from '@/hooks/use-image-generation';
import { client, orpc } from '@/utils/orpc';
import { ImageEmptyState } from './empty-state';
import { StandardizedSidebarItem } from './standardized-sidebar-item';

export function ImagesSidebar() {
  const location = useLocation();
  const isImagePage = location.pathname.startsWith('/image');

  const listQuery = useQuery(
    orpc.images.list.queryOptions({ enabled: isImagePage })
  );

  const deleteMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => client.images.delete({ id }),
    onSuccess: async () => {
      await listQuery.refetch();
    },
  });

  const handleDeleteWrapper = (id: string) => {
    deleteMutation.mutate({ id });
  };

  const handleDownloadWrapper = (id: string, fileName: string) => {
    try {
      // Create download link for the file endpoint
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
      <div className="space-y-2 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            className="h-20 animate-pulse rounded bg-sidebar-accent/50"
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
    <div className="space-y-1">
      {images.map((image: GeneratedImage, index) => (
        <>
          <StandardizedSidebarItem
            date={formatDate(image.createdAt as string)}
            iconText={image.prompt.substring(0, 2).toUpperCase()}
            key={image.id}
            onDelete={() => handleDeleteWrapper(image.id)}
            onDownload={() =>
              handleDownloadWrapper(image.id, `image-${image.id}.png`)
            }
            params={{ id: image.id }}
            subtitle={
              image.prompt.slice(0, 10) + (image.prompt.length > 10 ? '...' : '')
            }
            title={
              image.prompt.slice(0, 30) + (image.prompt.length > 30 ? '...' : '')
            }
            to="/image/$id"
          />
          {index < images.length - 1 && <SidebarSeparator />}
        </>
      ))}
    </div>
  );
}
