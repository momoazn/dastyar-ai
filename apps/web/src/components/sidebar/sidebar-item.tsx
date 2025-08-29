import { useMutation } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArchiveIcon, PencilIcon, TrashIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui';
import { client, orpc, queryClient } from '@/utils/orpc';
import type { SidebarItemProps } from './types';

export function SidebarItem({
  title,
  to,
  params,
  onArchive,
  onDelete,
}: SidebarItemProps) {
  const threadId = params?.id;
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(title ?? '');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setValue(title ?? '');
  }, [title]);

  const renameMutation = useMutation({
    mutationFn: async (newTitle: string) => {
      if (!threadId) {
        return;
      }
      await client.threads.rename({ id: threadId, title: newTitle });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: orpc.threads.list.queryKey(),
      });
    },
  });

  const startEditing = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setValue(title ?? '');
  };

  const commitEditing = async () => {
    const newTitle = value.trim();
    if (!threadId) {
      cancelEditing();
      return;
    }
    if (!newTitle || newTitle === (title ?? '')) {
      cancelEditing();
      return;
    }
    await renameMutation.mutateAsync(newTitle);
    setIsEditing(false);
  };

  return (
    <Link
      className="relative flex h-12 items-center justify-between border-b p-4 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      params={params}
      to={to}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <div className="absolute top-0 right-0 z-10 h-full w-1 bg-primary" />
          )}
          <span className="font-medium">
            {isEditing ? (
              <input
                className="w-full rounded-sm border px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onBlur={commitEditing}
                onChange={(e) => setValue(e.target.value)}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commitEditing();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    cancelEditing();
                  }
                }}
                placeholder="بدون عنوان"
                ref={inputRef}
                value={value}
              />
            ) : (
              (title ?? 'بدون عنوان')
            )}
          </span>
          <div className="flex items-center gap-0">
            {threadId && (
              <Button
                className="cursor-pointer hover:text-amber-500"
                onClick={startEditing}
                size="icon"
                title="ویرایش عنوان"
                variant="ghost"
              >
                <PencilIcon className="size-4" />
              </Button>
            )}
            {onArchive && (
              <Button
                className="cursor-pointer hover:text-blue-500"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onArchive?.(e);
                }}
                size="icon"
                variant="ghost"
              >
                <ArchiveIcon className="size-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                className="cursor-pointer hover:text-red-500"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete?.(e);
                }}
                size="icon"
                variant="ghost"
              >
                <TrashIcon className="size-4" />
              </Button>
            )}
          </div>
        </>
      )}
    </Link>
  );
}
