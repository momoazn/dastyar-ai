import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SettingsSectionProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
};

export function SettingsSection({
  title,
  description,
  icon,
  children,
  defaultOpen = true,
  className,
}: SettingsSectionProps) {
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);

  return (
    <div
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        className
      )}
    >
      <Button
        className="flex w-full items-center justify-between gap-3 p-4 text-right hover:bg-muted/50"
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
      >
        <div className="flex items-center gap-3">
          {icon && <div className="text-muted-foreground">{icon}</div>}
          <div className="flex-1 text-right">
            <h3 className="font-semibold">{title}</h3>
            {description && (
              <p className="text-muted-foreground text-sm">{description}</p>
            )}
          </div>
        </div>
        <ChevronLeft
          className={cn(
            "h-4 w-4 shrink-0 transition-transform",
            isOpen ? "rotate-0" : "rotate-180"
          )}
        />
      </Button>

      {isOpen && <div className="border-t bg-muted/20 p-5">{children}</div>}
    </div>
  );
}
