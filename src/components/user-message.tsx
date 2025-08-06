import { memo, useCallback, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { MessagesRecord } from "@/lib/pocketbase-types";
import { detectTextDirection } from "@/lib/utils";
import { Check, Copy } from "lucide-react";

export interface UserMessageProps {
  message: MessagesRecord;
}

export const UserMessage = memo(({ message }: UserMessageProps) => {
  const [copySuccess, setCopySuccess] = useState(false);

  // Memoize expensive computations
  const textDirection = useMemo(
    () => detectTextDirection(message.content || ""),
    [message.content],
  );

  const formattedTime = useMemo(() => {
    if (!message.created) return null;
    return new Date(message.created).toLocaleTimeString("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [message.created]);

  const handleCopy = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  }, []);

  return (
    <div className="group animate-in fade-in-50 slide-in-from-left-2 flex w-full justify-end duration-300">
      <div className="max-w-[85%] sm:max-w-[75%] lg:max-w-[65%]">
        {/* Enhanced message bubble with gradient and shadows */}
        <div className="relative">
          <div
            className="bg-primary text-primary-foreground border-primary/20 relative rounded-lg rounded-br-sm border px-4 py-3 text-sm leading-relaxed shadow-md transition-all duration-200 hover:shadow-lg"
            dir={textDirection}
          >
            {/* Subtle overlay for depth */}
            <div className="pointer-events-none absolute inset-0 rounded-lg rounded-br-sm bg-gradient-to-br from-white/8 to-black/5" />

            {/* Message content */}
            <div className="relative z-10 break-words whitespace-pre-wrap">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content || ""}
              </ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Enhanced metadata and actions */}
        <div className="mt-1 flex items-center justify-between gap-3">
          {/* Timestamp with better styling */}
          <time className="text-muted-foreground/80 text-xs font-medium">
            {formattedTime}
          </time>

          {/* Actions with improved positioning */}
          <TooltipProvider>
            <div className="translate-y-1 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-accent hover:text-accent-foreground h-7 w-7 rounded-full p-0 transition-all duration-200 hover:scale-105"
                    onClick={() => handleCopy(message.content || "")}
                  >
                    {copySuccess ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p className="text-xs">
                    {copySuccess
                      ? PERSIAN_TEXTS.chat.copied
                      : PERSIAN_TEXTS.chat.copy}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
});
