import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useLocation, useSearch } from '@tanstack/react-router';
import { Calendar, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';
import type { GeneratedImage } from '@/hooks/use-image-generation';
import { client, orpc } from '@/utils/orpc';

export function ImagesSidebar() {
  const location = useLocation();
  const search = useSearch({ from: '/image' });
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

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    deleteMutation.mutate({ id });
  };

  const handleDownload = async (e: React.MouseEvent, id: string, fileName: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      // Create download link for the file endpoint
      const downloadUrl = `/api/images/${id}/download`;
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
          <div key={i} className="h-20 animate-pulse rounded bg-sidebar-accent/50" />
        ))}
      </div>
    );
  }

  const images = Array.isArray(listQuery.data) ? listQuery.data as GeneratedImage[] : [];
  
  if (!images.length) {
    return (
      <div className="p-4 text-center text-sidebar-foreground/60">
        <div className="text-sm">هنوز تصویری تولید نشده است</div>
        <div className="text-xs text-sidebar-foreground/40 mt-1">
          با استفاده از فرم سمت راست، تصویر جدید ایجاد کنید
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {images.map((image: GeneratedImage) => (
        <Link
          key={image.id}
          to="/image"
          search={{ id: image.id }}
          className="group relative block"
        >
          {({ isActive }) => (
            <div
              className={`relative flex items-center gap-3 border-b p-3 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
              }`}
            >
              {isActive && (
                <div className="absolute top-0 right-0 h-full w-1 bg-blue-500" />
              )}
              
              {/* Prompt Icon */}
              <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-md bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground">
                {image.prompt.substring(0, 2).toUpperCase()}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {image.prompt.slice(0, 10)}
                  {image.prompt.length > 10 && '...'}
                </div>
                <div className="flex items-center gap-1 text-xs text-sidebar-foreground/60 mt-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(image.createdAt)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 cursor-pointer hover:text-blue-500"
                  onClick={(e) => handleDownload(e, image.id, image.fileName || `image-${image.id}.png`)}
                  title="دانلود تصویر"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 cursor-pointer hover:text-red-500"
                  onClick={(e) => handleDelete(e, image.id)}
                  title="حذف تصویر"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}