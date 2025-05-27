import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui";
import type { DbMessage as MessageType } from "../../generated/apiSchemas";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { cn, detectTextDirection } from "@/lib/utils";
import { BotIcon, Loader2, UserIcon, Eye, EyeOff } from "lucide-react";

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

  return (
    <div
      id={`message-${message.id}`}
      className={cn(
        "group flex w-full gap-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Avatar for assistant */}
      {isAssistant && (
        <div className="mt-1 flex-shrink-0">
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex h-8 w-8 items-center justify-center rounded-md">
            <BotIcon className="h-4 w-4" />
          </div>
        </div>
      )}

      {/* Message content */}
      <div
        dir={detectTextDirection(message.content || "")}
        className={cn(
          "max-w-[80%] transition-all duration-200",
          isUser && "order-1"
        )}
      >
        {/* Message bubble */}
        <div
          className={cn(
            "rounded-md border shadow-sm",
            isUser
              ? "bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-border"
              : "bg-sidebar border-sidebar-border"
          )}
        >
          {/* Thinking section header and content */}
          {hasThinking && (
            <>
              <div className="flex items-center justify-between border-b border-sidebar-border px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="bg-amber-500 h-2 w-2 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-sidebar-foreground">
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
                  {collapsed ? <Eye className="mr-1 h-3 w-3" /> : <EyeOff className="mr-1 h-3 w-3" />}
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
                    : "max-h-[400px] opacity-100 border-b border-sidebar-border"
                )}
              >
                <div className="bg-muted/50 p-3">
                  <div
                    dir="ltr"
                    className="prose prose-sm max-w-none text-muted-foreground"
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.reasoning || ""}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Loading state */}
          {message.status === "idle" && (
            <div className="flex items-center justify-center p-4">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-sidebar-primary" />
                <span className="text-sm text-muted-foreground">
                  در حال تولید پاسخ...
                </span>
              </div>
            </div>
          )}

          {/* Main message content */}
          <div className="p-3">
            <article
              className={cn(
                "prose prose-sm max-w-none break-words",
                isUser
                  ? "prose-invert"
                  : "dark:prose-invert prose-sidebar"
              )}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content || ""}
              </ReactMarkdown>
            </article>
          </div>

          {/* Message timestamp footer */}
          <div className="px-3 pb-2 text-right">
            <time className={cn(
              "text-xs opacity-70",
              isUser ? "text-sidebar-primary-foreground" : "text-sidebar-foreground"
            )}>
              {message.sent_at ? new Date(message.sent_at).toLocaleTimeString('fa-IR', {
                hour: '2-digit',
                minute: '2-digit'
              }) : ''}
            </time>
          </div>
        </div>
      </div>

      {/* Avatar for user */}
      {isUser && (
        <div className="mt-1 flex-shrink-0 order-2">
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex h-8 w-8 items-center justify-center rounded-md">
            <UserIcon className="h-4 w-4" />
          </div>
        </div>
      )}
    </div>
  );
}
