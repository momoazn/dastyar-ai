import { Check, Copy } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fa } from "@/lib/texts";

type CopyButtonProps = {
  className?: string;
  content?: string;
  iconClassName?: string;
  tooltipSide?: "top" | "right" | "bottom" | "left";
};

export function formatMessageTime(value?: string): string | null {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CopyMessageButton({
  className,
  content = "",
  iconClassName = "h-4 w-4",
  tooltipSide,
}: CopyButtonProps) {
  const [copySuccess, setCopySuccess] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      setCopySuccess(false);
    }
  }, [content]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className={className}
            onClick={copy}
            size="sm"
            type="button"
            variant="ghost"
          >
            {copySuccess ? (
              <Check className={`${iconClassName} text-green-600`} />
            ) : (
              <Copy className={iconClassName} />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side={tooltipSide}>
          <p className="text-xs">
            {copySuccess ? fa.chat.copied : fa.chat.copy}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
