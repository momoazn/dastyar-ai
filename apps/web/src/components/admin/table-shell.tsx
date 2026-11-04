import type * as React from "react";

import {
  Surface,
  SurfaceContent,
  SurfaceHeader,
  SurfaceStatus,
  SurfaceTitle,
} from "@/components/ui";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";

type AdminTableShellProps = {
  title: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  errorMessage?: string;
  loadingMessage?: string;
};

export function AdminTableShell({
  title,
  badge,
  actions,
  filters,
  footer,
  children,
  isLoading,
  isError,
  isEmpty,
  emptyMessage,
  errorMessage,
  loadingMessage,
}: AdminTableShellProps) {
  let content: React.ReactNode = children;
  if (isLoading) {
    content = (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner className="size-8" />
          <span className="text-sm">{loadingMessage}</span>
        </div>
      </div>
    );
  } else if (isError) {
    content = (
      <div className="py-8 text-center text-destructive">
        <p className="text-sm">{errorMessage}</p>
      </div>
    );
  } else if (isEmpty) {
    content = (
      <div className="py-8 text-center text-muted-foreground">
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <Surface className="min-w-0" padded={false}>
      <SurfaceHeader className="justify-between" dir="rtl">
        <div className="flex items-center gap-2">
          <SurfaceTitle>{title}</SurfaceTitle>
          {badge}
        </div>
        {actions}
      </SurfaceHeader>

      {filters ? (
        <div className="border-b bg-muted/30 px-4 py-3" dir="rtl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {filters}
          </div>
        </div>
      ) : null}

      <SurfaceContent className={cn("p-0", filters && "pt-0")}>
        {content}
      </SurfaceContent>

      {footer ? (
        <SurfaceStatus className="justify-start bg-muted/20 px-4 py-2">
          {footer}
        </SurfaceStatus>
      ) : null}
    </Surface>
  );
}
