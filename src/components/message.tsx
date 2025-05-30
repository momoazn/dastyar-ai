import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { cn, detectTextDirection } from "@/lib/utils";
import { Eye, EyeOff, Loader2, StopCircle } from "lucide-react";
import type { DbMessage as MessageType } from "../../generated/apiSchemas";

const THINKING_MODELS = ["deepseek-r1", "deepscaler"];

const isThinkingModel = (model: string) => {
  return THINKING_MODELS.find((m) => model.includes(m)) !== undefined;
};

export interface MessageProps {
  message: MessageType;
}

export function Message({ message }: MessageProps) {
  const [collapsed, setCollapsed] = useState(false);

  const hasThinking =
    message?.role === "assistant" &&
    message?.reasoning !== "" &&
    message?.model &&
    isThinkingModel(message.model);

  const isUser = message.role === "user";
  const isStopped = message.status === "stopped";
  const isGenerating =
    message.status === "idle" ||
    message.status === "reasoning" ||
    message.status === "responding";

  // User message with bubble
  if (isUser) {
    return (
      <div className="flex w-full justify-end">
        <div className="max-w-[85%] rounded-2xl bg-blue-600 px-4 py-3 text-white">
          <div
            dir={detectTextDirection(message.content || "")}
            className="text-sm leading-relaxed"
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              className="prose prose-sm prose-invert max-w-none break-words [&>*]:m-0"
            >
              {message.content || ""}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  // Assistant message without bubble (flowing text)
  return (
    <div className="w-full">
      {/* Thinking section */}
      {hasThinking && (
        <div className="bg-muted/50 mb-6 rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500"></div>
              <span className="text-muted-foreground text-sm font-medium">
                تفکر
              </span>
            </div>

            {/* Thinking toggle button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setCollapsed((c) => !c)}
            >
              {collapsed ? (
                <Eye className="mr-1 h-3 w-3" />
              ) : (
                <EyeOff className="mr-1 h-3 w-3" />
              )}
              {collapsed
                ? PERSIAN_TEXTS.chat.showThoughts
                : PERSIAN_TEXTS.chat.hideThoughts}
            </Button>
          </div>

          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              collapsed ? "max-h-0 opacity-0" : "max-h-[400px] opacity-100",
            )}
          >
            <div dir="ltr" className="text-muted-foreground text-sm">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                className="prose prose-sm max-w-none"
              >
                {message.reasoning || ""}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isGenerating && (
        <div className="mb-4 flex items-center gap-2">
          <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
          <span className="text-muted-foreground text-sm">
            در حال تولید پاسخ...
          </span>
        </div>
      )}

      {/* Main message content (flowing without bubble) */}
      {(message.content || !isGenerating) && (
        <div
          dir={detectTextDirection(message.content || "")}
          className="w-full"
        >
          <div className="text-foreground leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              className={cn(
                "prose prose-gray dark:prose-invert max-w-none break-words",
                "prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground",
                "prose-li:text-foreground prose-code:text-foreground prose-blockquote:text-foreground",
                "prose-a:text-blue-600 dark:prose-a:text-blue-400",
                "prose-pre:bg-muted prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
                "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
              )}
            >
              {message.content || ""}
            </ReactMarkdown>
          </div>

          {/* Stopped message indicator */}
          {isStopped && (
            <div className="text-muted-foreground mt-4 flex items-center gap-2 text-xs">
              <StopCircle className="h-3 w-3" />
              <span>{PERSIAN_TEXTS.chat.generationStopped}</span>
            </div>
          )}

          {/* Message timestamp */}
          {message.sent_at && (
            <div className="mt-4">
              <time className="text-muted-foreground/70 text-xs">
                {new Date(message.sent_at).toLocaleTimeString("fa-IR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
