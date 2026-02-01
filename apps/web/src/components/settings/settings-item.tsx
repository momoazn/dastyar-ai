import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SettingsItemProps = {
  label: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function SettingsItem({
  label,
  description,
  children,
  className,
}: SettingsItemProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1 text-right">
          <div className="block font-medium text-sm">{label}</div>
          {description && (
            <p className="mt-1 text-muted-foreground text-xs">{description}</p>
          )}
        </div>
        <div className="shrink-0">{children}</div>
      </div>
    </div>
  );
}
