import { Message } from "@/lib/api/chat";
import { cn, detectTextDirection } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "./ui/button";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { useState } from "react";

export interface AIMessageProps {
  message: Message;
}

export function AIMessage({ message }: AIMessageProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "flex",
        message.role === "assistant" ? "justify-start" : "justify-end",
      )}
    >
      <div
        dir={detectTextDirection(message.content)}
        className={cn(
          "max-w-[85%] space-y-2 rounded-lg p-3",
          message.role === "assistant"
            ? "bg-secondary text-secondary-foreground"
            : "bg-primary text-primary-foreground",
        )}
      >
        <div className="flex items-center justify-between">
          {!message && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="animate-pulse">
                {PERSIAN_TEXTS.chat.thinking}
              </span>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed
              ? PERSIAN_TEXTS.chat.showThoughts
              : PERSIAN_TEXTS.chat.hideThoughts}
          </Button>
        </div>

        <div
          dir="ltr"
          className={cn(
            "border-l-2 border-muted pl-2 text-sm text-muted-foreground",
            collapsed && "hidden",
          )}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.think}
          </ReactMarkdown>
        </div>

        {message.state === "idle" && (
          <div className="flex items-center justify-between">
            <span className="animate-pulse">...</span>
          </div>
        )}
        <article
          className={cn(
            "prose max-w-none",
            message.role === "user" && "prose-invert",
          )}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
