import { Link } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';
import { Archive, Download, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

export interface StandardizedSidebarItemProps {
  title: string;
  to: string;
  params?: Record<string, string>;
  search?: Record<string, string>;
  icon?: LucideIcon;
  iconText?: string;
  subtitle?: string;
  date?: string;
  onEdit?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  isEditing?: boolean;
  editingValue?: string;
  onEditingChange?: (value: string) => void;
  onEditingCommit?: () => void;
  onEditingCancel?: () => void;
  className?: string;
  showActionsOnHover?: boolean;
}

export function StandardizedSidebarItem({
  title,
  to,
  params,
  search,
  icon: Icon,
  iconText,
  subtitle,
  date,
  onEdit,
  onArchive,
  onDelete,
  onDownload,
  isEditing = false,
  editingValue,
  onEditingChange,
  onEditingCommit,
  onEditingCancel,
  className,
  showActionsOnHover = true,
}: StandardizedSidebarItemProps) {
  const hasActions = onEdit || onArchive || onDelete || onDownload;
  const hasContent = subtitle || date;

  return (
    <Link
      className={cn(
        'group relative flex min-h-9 items-center justify-between border-b p-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        className
      )}
      params={params}
      search={search}
      to={to}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <div className="absolute top-0 right-0 z-10 h-full w-1 bg-primary" />
          )}

          {/* Left Content */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {/* Icon */}
            {(Icon || iconText) && (
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-sidebar-accent font-medium text-sidebar-accent-foreground text-xs">
                {Icon ? <Icon className="h-3.5 w-3.5" /> : iconText}
              </div>
            )}

            {/* Text Content */}
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <input
                  className="w-full rounded-sm border px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onBlur={onEditingCommit}
                  onChange={(e) => onEditingChange?.(e.target.value)}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      onEditingCommit?.();
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      onEditingCancel?.();
                    }
                  }}
                  placeholder="بدون عنوان"
                  value={editingValue}
                />
              ) : (
                <>
                  <div className="truncate font-medium">
                    {title || 'بدون عنوان'}
                  </div>
                  {hasContent && (
                    <div className="mt-1 flex items-center gap-1 text-sidebar-foreground/60 text-xs">
                      {subtitle && <span>{subtitle}</span>}
                      {date && subtitle && <span>•</span>}
                      {date && <span>{date}</span>}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          {hasActions && (
            <div
              className={cn(
                'flex items-center gap-1',
                showActionsOnHover &&
                  'opacity-0 transition-opacity group-hover:opacity-100'
              )}
            >
              {onDownload && (
                <Button
                  className="h-8 w-8 cursor-pointer hover:text-blue-500"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDownload();
                  }}
                  size="icon"
                  title="دانلود"
                  variant="ghost"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              {onEdit && (
                <Button
                  className="h-8 w-8 cursor-pointer hover:text-amber-500"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit();
                  }}
                  size="icon"
                  title="ویرایش"
                  variant="ghost"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              {onArchive && (
                <Button
                  className="h-8 w-8 cursor-pointer hover:text-blue-500"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onArchive();
                  }}
                  size="icon"
                  title="بایگانی"
                  variant="ghost"
                >
                  <Archive className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  className="h-8 w-8 cursor-pointer hover:text-red-500"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete();
                  }}
                  size="icon"
                  title="حذف"
                  variant="ghost"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </Link>
  );
}
