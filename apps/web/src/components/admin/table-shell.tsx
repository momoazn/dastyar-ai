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
  if (isLoading) {
    return (
      <Surface padded={false}>
        <SurfaceHeader className="justify-between">
          <SurfaceTitle>{title}</SurfaceTitle>
          {badge}
        </SurfaceHeader>
        <SurfaceContent className="flex items-center justify-center py-10 text-muted-foreground">
          <div className="flex flex-col items-center gap-3">
            <LoadingSpinner className="size-8" />
            <span className="text-sm">{loadingMessage}</span>
          </div>
        </SurfaceContent>
      </Surface>
    );
  }

  if (isError) {
    return (
      <Surface padded={false}>
        <SurfaceHeader className="justify-between">
          <SurfaceTitle>{title}</SurfaceTitle>
          {badge}
        </SurfaceHeader>
        <SurfaceContent className="py-8 text-center text-destructive">
          <p className="text-sm">{errorMessage}</p>
        </SurfaceContent>
      </Surface>
    );
  }

  if (isEmpty) {
    return (
      <Surface padded={false}>
        <SurfaceHeader className="justify-between">
          <SurfaceTitle>{title}</SurfaceTitle>
          {badge}
        </SurfaceHeader>
        <SurfaceContent className="py-8 text-center text-muted-foreground">
          <p className="text-sm">{emptyMessage}</p>
        </SurfaceContent>
      </Surface>
    );
  }

  return (
    <Surface padded={false}>
      <SurfaceHeader className="justify-between">
        <div className="flex items-center gap-2">
          <SurfaceTitle>{title}</SurfaceTitle>
          {badge}
        </div>
        {actions}
      </SurfaceHeader>

      {filters ? (
        <div className="border-b px-4 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {filters}
          </div>
        </div>
      ) : null}

      <SurfaceContent className={cn("p-0", filters && "pt-0")}>
        {children}
      </SurfaceContent>

      {footer ? (
        <SurfaceStatus className="justify-end">{footer}</SurfaceStatus>
      ) : null}
    </Surface>
  );
}
