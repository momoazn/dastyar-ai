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
    <div className={cn('group/sidebar-item relative', className)}>
      <Link
        className="flex min-h-8 items-center justify-between rounded-md p-1.5 text-sm transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-sm"
        params={params}
        search={search}
        to={to}
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <div className="absolute top-0 right-0 z-10 h-full w-0.5 rounded-l-full bg-primary shadow-[0_0_6px_rgba(var(--primary),0.3)]" />
            )}

            {/* Left Content */}
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {/* Icon */}
              {(Icon || iconText) && (
                <div
                  className={cn(
                    'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md font-medium text-xs transition-all duration-200',
                    isActive
                      ? 'bg-primary/20 text-primary shadow-sm'
                      : 'bg-sidebar-accent text-sidebar-accent-foreground group-hover/sidebar-item:bg-primary/10 group-hover/sidebar-item:text-primary'
                  )}
                >
                  {Icon ? <Icon className="h-3.5 w-3.5" /> : iconText}
                </div>
              )}

              {/* Text Content */}
              <div className="min-w-0 flex-1">
                {isEditing ? (
                  <input
                    className="w-full rounded-md border bg-background px-2 py-1 text-sm shadow-sm transition-shadow focus-visible:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                    <div
                      className={cn(
                        'truncate font-medium text-sm transition-colors',
                        isActive && 'text-primary'
                      )}
                    >
                      {title || 'بدون عنوان'}
                    </div>
                    {hasContent && (
                      <div className="mt-0.5 flex items-center gap-1 text-sidebar-foreground/60 text-xs">
                        {subtitle && (
                          <span className="truncate">{subtitle}</span>
                        )}
                        {date && subtitle && <span>•</span>}
                        {date && (
                          <span className="whitespace-nowrap">{date}</span>
                        )}
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
                  'flex items-center gap-0',
                  showActionsOnHover &&
                    'opacity-0 transition-all duration-200 group-hover/sidebar-item:opacity-100'
                )}
              >
                {onDownload && (
                  <Button
                    className="h-6 w-6 cursor-pointer rounded-md transition-all duration-200 hover:scale-105 hover:bg-blue-500/10 hover:text-blue-500"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDownload();
                    }}
                    size="icon"
                    title="دانلود"
                    variant="ghost"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                )}
                {onEdit && (
                  <Button
                    className="h-6 w-6 cursor-pointer rounded-md transition-all duration-200 hover:scale-105 hover:bg-amber-500/10 hover:text-amber-500"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onEdit();
                    }}
                    size="icon"
                    title="ویرایش"
                    variant="ghost"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
                {onArchive && (
                  <Button
                    className="h-6 w-6 cursor-pointer rounded-md transition-all duration-200 hover:scale-105 hover:bg-blue-500/10 hover:text-blue-500"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onArchive();
                    }}
                    size="icon"
                    title="بایگانی"
                    variant="ghost"
                  >
                    <Archive className="h-3 w-3" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    className="h-6 w-6 cursor-pointer rounded-md transition-all duration-200 hover:scale-105 hover:bg-red-500/10 hover:text-red-500"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete();
                    }}
                    size="icon"
                    title="حذف"
                    variant="ghost"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </Link>
    </div>
  );
}
