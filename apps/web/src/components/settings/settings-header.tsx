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
    <div className={cn("text-right", className)}>
      <div className="flex items-center gap-3">
        {Icon && <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />}
        <div className="flex-1">
          <h2 className="font-bold text-xl">{title}</h2>
          {description && (
            <p className="mt-1.5 text-muted-foreground text-sm">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
