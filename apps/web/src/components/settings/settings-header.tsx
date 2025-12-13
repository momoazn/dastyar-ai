import type { LucideIcon } from "lucide-react";

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
    <div className={`text-right ${className || ""}`}>
      <div className="flex items-center gap-3">
        {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
        <div className="flex-1">
          <h2 className="font-bold text-xl">{title}</h2>
          {description && (
            <p className="mt-1 text-muted-foreground text-sm">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
