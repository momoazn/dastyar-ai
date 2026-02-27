import type * as React from "react";

import { cn } from "@/lib/utils";

type SurfaceProps = React.ComponentProps<"div"> & {
  padded?: boolean;
};

export function Surface({ className, padded = true, ...props }: SurfaceProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        padded && "p-4",
        className
      )}
      {...props}
    />
  );
}

type SurfaceHeaderProps = React.ComponentProps<"div">;

export function SurfaceHeader({ className, ...props }: SurfaceHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3",
        className
      )}
      {...props}
    />
  );
}

type SurfaceTitleProps = React.ComponentProps<"div">;

export function SurfaceTitle({ className, ...props }: SurfaceTitleProps) {
  return (
    <div
      className={cn(
        "leading-6",
        "font-semibold",
        "text-base",
        "text-end",
        className
      )}
      {...props}
    />
  );
}

type SurfaceDescriptionProps = React.ComponentProps<"div">;

export function SurfaceDescription({
  className,
  ...props
}: SurfaceDescriptionProps) {
  return (
    <div
      className={cn("leading-6", "text-sm", "text-muted-foreground", className)}
      {...props}
    />
  );
}

type SurfaceToolbarProps = React.ComponentProps<"div">;

export function SurfaceToolbar({ className, ...props }: SurfaceToolbarProps) {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-2 px-4 py-3", className)}
      {...props}
    />
  );
}

type SurfaceContentProps = React.ComponentProps<"div">;

export function SurfaceContent({ className, ...props }: SurfaceContentProps) {
  return <div className={cn("space-y-4 p-4", className)} {...props} />;
}

type SurfaceStatusProps = React.ComponentProps<"div">;

export function SurfaceStatus({ className, ...props }: SurfaceStatusProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 border-t bg-muted/40 px-4 py-2.5 text-muted-foreground text-sm",
        className
      )}
      {...props}
    />
  );
}
