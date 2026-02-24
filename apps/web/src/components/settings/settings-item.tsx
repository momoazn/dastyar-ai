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
    <div className={cn("rounded-lg border bg-background/70 px-4 py-3", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="flex-1 text-right">
          <div className="block font-medium text-sm leading-6">{label}</div>
          {description && (
            <p className="mt-1 text-muted-foreground text-xs leading-5">
              {description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 justify-start sm:justify-end">{children}</div>
      </div>
    </div>
  );
}
