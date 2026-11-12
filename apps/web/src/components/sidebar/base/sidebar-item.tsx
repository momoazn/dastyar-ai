import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Archive, Download, Pencil, Trash2 } from "lucide-react";
import { Button, useSidebar } from "@/components/ui";
import { fa } from "@/lib/texts";
import { cn } from "@/lib/utils";
import {
  sidebarActionGroup,
  sidebarIconWrapper,
  sidebarLinkActive,
  sidebarLinkBase,
  sidebarLinkHover,
  sidebarMetaText,
} from "./classes";

export type SidebarItemAction = {
  type: "edit" | "archive" | "delete" | "download";
  onClick: () => void;
  title: string;
  className?: string;
};

export type SidebarItemProps = {
  title: string;
  to: string;
  params?: Record<string, string>;
  search?: Record<string, string | number | boolean | null>;
  icon?: LucideIcon;
  iconText?: string;
  subtitle?: string;
  date?: string;
  actions?: SidebarItemAction[];
  isEditing?: boolean;
  editingValue?: string;
  onEditingChange?: (value: string) => void;
  onEditingCommit?: () => void;
  onEditingCancel?: () => void;
  className?: string;
  showActionsOnHover?: boolean;
};

const actionIcons = {
  edit: Pencil,
  archive: Archive,
  delete: Trash2,
  download: Download,
};

const actionColors = {
  edit: "hover:bg-amber-500/10 hover:text-amber-500",
  archive: "hover:bg-blue-500/10 hover:text-blue-500",
  delete: "hover:bg-red-500/10 hover:text-red-500",
  download: "hover:bg-blue-500/10 hover:text-blue-500",
};

export function SidebarItem({
  title,
  to,
  params,
  search,
  icon: Icon,
  iconText,
  subtitle,
  date,
  actions = [],
  isEditing = false,
  editingValue,
  onEditingChange,
  onEditingCommit,
  onEditingCancel,
  className,
  showActionsOnHover = true,
}: SidebarItemProps) {
  const { isMobile, setOpenMobile } = useSidebar();
  const hasActions = actions.length > 0;
  const hasContent = subtitle || date;

  return (
    <div className={cn("group/sidebar-item relative", className)}>
      <Link
        activeProps={{ "aria-current": "page" }}
        onClick={() => {
          if (isMobile) {
            setOpenMobile(false);
          }
        }}
        params={params}
        search={search}
        to={to}
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <div className="absolute top-0 right-0 z-10 h-full w-0.5 rounded-l-full bg-primary shadow-[0_0_6px_rgba(var(--primary),0.3)]" />
            )}

            <div
              className={cn(
                sidebarLinkBase,
                sidebarLinkHover,
                isActive && sidebarLinkActive
              )}
            >
              {/* Left Content */}
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {/* Icon */}
                {(Icon || iconText) && (
                  <div
                    className={cn(
                      sidebarIconWrapper,
                      isActive
                        ? "bg-primary/20 text-primary shadow-sm"
                        : "bg-sidebar-accent text-sidebar-foreground group-hover/sidebar-item:bg-primary/10 group-hover/sidebar-item:text-primary"
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
                        if (e.key === "Enter") {
                          e.preventDefault();
                          onEditingCommit?.();
                        } else if (e.key === "Escape") {
                          e.preventDefault();
                          onEditingCancel?.();
                        }
                      }}
                      placeholder={fa.general.untitled}
                      value={editingValue}
                    />
                  ) : (
                    <>
                      <div
                        className={cn(
                          "truncate font-medium text-sm transition-colors",
                          isActive && "text-primary"
                        )}
                      >
                        {title || fa.general.untitled}
                      </div>
                      {hasContent && (
                        <div className={sidebarMetaText}>
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
                    sidebarActionGroup,
                    showActionsOnHover &&
                      "opacity-0 transition-all duration-200 group-hover/sidebar-item:opacity-100"
                  )}
                >
                  {actions.map((action) => {
                    const ActionIcon = actionIcons[action.type];
                    const colorClass = actionColors[action.type];

                    return (
                      <Button
                        className={cn(
                          "h-6 w-6 cursor-pointer rounded-md transition-colors",
                          colorClass,
                          action.className
                        )}
                        key={action.type}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          action.onClick();
                        }}
                        size="icon"
                        title={action.title}
                        variant="ghost"
                      >
                        <ActionIcon className="h-3 w-3" />
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </Link>
    </div>
  );
}
