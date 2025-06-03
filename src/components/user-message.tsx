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

  // User message actions below content
  const UserMessageActions = useMemo(
    () => (
      <TooltipProvider>
        <div className="mt-2 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 rounded-md p-0"
                onClick={() => handleCopy(message.content || "")}
              >
                {copySuccess ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {copySuccess
                  ? PERSIAN_TEXTS.chat.copied
                  : PERSIAN_TEXTS.chat.copy}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    ),
    [copySuccess, handleCopy, message.content],
  );

  return (
    <div className="group flex w-full justify-end">
      <div className="max-w-[85%]">
        <div
          className="rounded-sm bg-blue-600 px-3 py-2 text-sm leading-relaxed text-white"
          dir={textDirection}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content || ""}
          </ReactMarkdown>
        </div>

        {/* Message timestamp */}
        {formattedTime && (
          <div className="mt-2">
            <time className="text-xs text-black dark:text-white">
              {formattedTime}
            </time>
          </div>
        )}

        {/* Actions below message bubble */}
        {UserMessageActions}
      </div>
    </div>
  );
});
