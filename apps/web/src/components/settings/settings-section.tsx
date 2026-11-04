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
        "overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm",
        className
      )}
    >
      <Button
        aria-expanded={isOpen}
        className="flex h-auto w-full items-center justify-between rounded-none px-4 py-3 text-right hover:bg-muted/40 md:px-5"
        dir="rtl"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        variant="ghost"
      >
        <div className="flex min-w-0 items-center gap-3 text-right">
          {icon && (
            <div className="shrink-0 rounded-md border bg-background p-2 text-muted-foreground">
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1 whitespace-normal text-right">
            <h3 className="font-semibold text-base">{title}</h3>
            {description && (
              <p className="mt-0.5 font-normal text-muted-foreground text-sm">
                {description}
              </p>
            )}
          </div>
        </div>
        <ChevronLeft
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            isOpen ? "rotate-0" : "rotate-180"
          )}
        />
      </Button>

      {isOpen && (
        <div className="border-t bg-muted/15 p-4 md:p-5">{children}</div>
      )}
    </div>
  );
}
