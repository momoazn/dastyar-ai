import { Link } from '@tanstack/react-router';
import { ArchiveIcon, TrashIcon } from 'lucide-react';
import { Button } from '@/components/ui';
import type { SidebarItemProps } from './types';

export function SidebarItem({
  title,
  to,
  params,
  onArchive,
  onDelete,
}: SidebarItemProps) {
  return (
    <Link
      className="relative flex h-12 items-center justify-between border-b p-4 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      params={params}
      to={to}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <div className="absolute top-0 right-0 h-full w-1 bg-blue-500" />
          )}
          <span className="font-medium">{title ?? 'Untitled'}</span>
          <div className="flex items-center gap-0">
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
