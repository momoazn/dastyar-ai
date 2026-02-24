import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type SettingsHeaderProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
};

export function SettingsHeader({
  title,
  description,
  icon: Icon,
  className,
}: SettingsHeaderProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card px-5 py-4 text-right shadow-sm",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-primary/60" />
      <div className="flex flex-row-reverse items-start gap-3">
        {Icon && <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary/80" />}
        <div className="flex-1">
          <h2 className="font-bold text-2xl tracking-tight">{title}</h2>
          {description && (
            <p className="mt-2 text-muted-foreground text-sm leading-6">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
