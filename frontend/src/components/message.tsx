import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui";
import type { DbMessage as MessageType } from "../../generated/apiSchemas";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { cn, detectTextDirection } from "@/lib/utils";
import {
  BotIcon,
  Loader2,
  UserIcon,
  Eye,
  EyeOff,
  StopCircle,
} from "lucide-react";

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
  const isAssistant = message.role === "assistant";
  const isStopped = message.status === "stopped";
  const isGenerating =
    message.status === "idle" ||
    message.status === "reasoning" ||
    message.status === "responding";

  // User message with bubble
  if (isUser) {
    return (
      <div className="flex w-full justify-end">
        <div className="flex max-w-[80%] gap-3">
          <div
            dir={detectTextDirection(message.content || "")}
            className="rounded-md border border-sidebar-border bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
          >
            <div className="p-3">
              <article className="prose prose-sm max-w-none break-words prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content || ""}
                </ReactMarkdown>
              </article>
            </div>
            <div className="px-3 pb-2 text-right">
              <time className="text-xs opacity-70 text-sidebar-primary-foreground">
                {message.sent_at
                  ? new Date(message.sent_at).toLocaleTimeString("fa-IR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
              </time>
            </div>
          </div>
          <div className="mt-1 flex-shrink-0">
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex h-8 w-8 items-center justify-center rounded-md">
              <UserIcon className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Assistant message without bubble (flowing text)
  return (
    <div className="group flex w-full gap-3">
      {/* Avatar for assistant */}
      <div className="mt-1 flex-shrink-0">
        <div className="bg-sidebar-primary text-sidebar-primary-foreground flex h-8 w-8 items-center justify-center rounded-md">
          <BotIcon className="h-4 w-4" />
        </div>
      </div>

      {/* Message content without bubble */}
      <div
        dir={detectTextDirection(message.content || "")}
        className="flex-1 min-w-0"
      >
        {/* Thinking section */}
        {hasThinking && (
          <div className="rounded-md border border-sidebar-border bg-sidebar shadow-sm mb-3">
            <div className="border-sidebar-border flex items-center justify-between border-b px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500"></div>
                <span className="text-sidebar-foreground text-xs font-medium">
                  فرآیند تفکر
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
                collapsed
                  ? "max-h-0 opacity-0"
                  : "border-sidebar-border max-h-[400px] border-b opacity-100",
              )}
            >
              <div className="bg-muted/50 p-3">
                <div
                  dir="ltr"
                  className="prose prose-sm text-muted-foreground max-w-none"
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.reasoning || ""}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isGenerating && (
          <div className="flex items-center gap-2 py-2">
            <Loader2 className="text-sidebar-primary h-4 w-4 animate-spin" />
            <span className="text-muted-foreground text-sm">
              در حال تولید پاسخ...
            </span>
          </div>
        )}

        {/* Main message content (flowing without bubble) */}
        {(message.content || !isGenerating) && (
          <div className="py-1">
            <article
              className={cn(
                "prose prose-sm max-w-none break-words dark:prose-invert",
                "prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground",
                "prose-li:text-foreground prose-code:text-foreground prose-blockquote:text-foreground",
                "prose-a:text-blue-600 dark:prose-a:text-blue-400"
              )}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content || ""}
              </ReactMarkdown>
            </article>

            {/* Stopped message indicator */}
            {isStopped && (
              <div className="text-muted-foreground mt-3 flex items-center gap-2 text-xs">
                <StopCircle className="h-3 w-3" />
                <span>{PERSIAN_TEXTS.chat.generationStopped}</span>
              </div>
            )}

            {/* Message timestamp */}
            <div className="mt-2">
              <time className="text-xs opacity-70 text-muted-foreground">
                {message.sent_at
                  ? new Date(message.sent_at).toLocaleTimeString("fa-IR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
              </time>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
