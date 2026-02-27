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
        "overflow-hidden rounded-xl border bg-card/95 text-card-foreground shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      <Button
        className="flex h-auto w-full items-center justify-between rounded-none px-5 py-4 text-right hover:bg-muted/40"
        dir="rtl"
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
      >
        <div className="flex items-center gap-3 text-right">
          {icon && (
            <div className="rounded-md border bg-background p-2 text-muted-foreground">
              {icon}
            </div>
          )}
          <div className="flex-1 text-right">
            <h3 className="font-semibold text-base">{title}</h3>
            {description && (
              <p className="mt-1 text-muted-foreground text-sm">
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
