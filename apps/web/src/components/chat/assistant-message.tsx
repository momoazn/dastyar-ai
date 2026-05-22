import {
  AlertCircle,
  Bot,
  Eye,
  EyeOff,
  Loader2,
  StopCircle,
} from "lucide-react";
import { memo, useCallback, useMemo, useState } from "react";
import { Streamdown } from "streamdown";
import {
  CopyMessageButton,
  formatMessageTime,
} from "@/components/chat/message-actions";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fa } from "@/lib/texts";
import { cn, detectTextDirection } from "@/lib/utils";

export type AssistantMessageProps = {
  message: {
    role: string;
    content?: string;
    model?: string;
    status?: string;
    sent_at?: string;
    reasoning?: string;
  };
};

export const AssistantMessage = memo(({ message }: AssistantMessageProps) => {
  const [collapsed, setCollapsed] = useState(false);

  const hasThinking =
    message.role === "assistant" && Boolean((message.reasoning || "").trim());

  const messageStatus = {
    isStopped: message.status === "stopped",
    isErrored: message.status === "errored",
    isGenerating:
      message.status === "idle" ||
      message.status === "streaming" ||
      message.status === "reasoning" ||
      message.status === "submitted",
  };

  const textDirection = detectTextDirection(message.content || "");
  const formattedTime = formatMessageTime(message.sent_at);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => !c);
  }, []);

  const AssistantMessageActions = useMemo(
    () => (
      <TooltipProvider>
        <div className="mt-2 flex items-center gap-1 opacity-0 transition-all duration-200 group-hover:opacity-100">
          <CopyMessageButton
            className="h-8 w-8 rounded-lg p-0 hover:bg-accent hover:text-accent-foreground"
            content={message.content}
          />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="h-8 w-8 rounded-lg p-0 hover:bg-accent hover:text-accent-foreground"
                size="sm"
                variant="ghost"
              >
                <Bot className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{message.model || "Unknown Model"}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    ),
    [message.content, message.model]
  );

  const { isStopped, isErrored, isGenerating } = messageStatus;

  return (
    <div className="group fade-in-50 slide-in-from-bottom-2 w-full animate-in duration-500">
      {hasThinking && (
        <div className="mb-2 rounded-xl border border-gray-200/40 bg-gray-50/40 p-3 shadow-sm dark:border-gray-700/30 dark:bg-gray-900/20">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200/60 dark:bg-gray-700/40">
                <div className="h-2 w-2 animate-pulse rounded-full bg-gray-500" />
              </div>
              <span className="font-medium text-gray-600 text-sm dark:text-gray-400">
                🧠 فرآیند تفکر
              </span>
            </div>

            <Button
              className="h-7 px-3 text-gray-500 text-xs hover:bg-gray-100/60 dark:text-gray-500 dark:hover:bg-gray-800/40"
              onClick={toggleCollapsed}
              size="sm"
              variant="ghost"
            >
              {collapsed ? (
                <Eye className="ml-1 h-3 w-3" />
              ) : (
                <EyeOff className="ml-1 h-3 w-3" />
              )}{" "}
              {collapsed ? "نمایش" : "پنهان"}
            </Button>
          </div>

          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              collapsed ? "max-h-0 opacity-0" : "max-h-[400px] opacity-100"
            )}
          >
            <div className="rounded-lg bg-gray-100/30 p-3 dark:bg-gray-800/20">
              <div
                className="text-justify text-gray-700 text-sm leading-relaxed dark:text-gray-300"
                dir={detectTextDirection(message.reasoning || "")}
              >
                <Streamdown>{message.reasoning || ""}</Streamdown>
              </div>
            </div>
          </div>
        </div>
      )}

      {isGenerating && (
        <div className="mb-4 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground text-sm">
            {fa.chat.thinking}
          </span>
        </div>
      )}

      {(message.content || !isGenerating) && (
        <div className="w-full">
          <div className="w-full" dir={textDirection}>
            <div className="prose prose-sm max-w-none text-foreground">
              <div className="text-justify leading-relaxed">
                <Streamdown>{message.content || ""}</Streamdown>
              </div>
            </div>

            {isStopped && (
              <div className="mt-4 flex items-center gap-2 text-muted-foreground text-xs">
                <StopCircle className="h-3 w-3" />
                <span>{fa.chat.generationStopped}</span>
              </div>
            )}

            {isErrored && (
              <div className="mt-4 flex items-center gap-2 text-muted-foreground text-xs">
                <AlertCircle className="h-3 w-3" />
                <span>{fa.chat.generationErrored}</span>
              </div>
            )}

            {formattedTime && (
              <div className="mt-4">
                <time className="text-muted-foreground/70 text-xs">
                  {formattedTime}
                </time>
              </div>
            )}
          </div>

          {AssistantMessageActions}
        </div>
      )}
    </div>
  );
});
