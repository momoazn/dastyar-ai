import { MessageWithThinking } from "@/hooks/use-persistent-chat";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { cn, detectTextDirection } from "@/lib/utils";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "./ui/button";

export interface AIMessageProps {
  message: MessageWithThinking;
  isThinkingModel: boolean;
}
export function AIMessage({ message, isThinkingModel }: AIMessageProps) {
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
        {isThinkingModel && message.role === "assistant" && (
          <div className="flex items-center justify-between">
            {!message.finishedThinking && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="animate-pulse">
                  {PERSIAN_TEXTS.chat.thinking}
                </span>
              </div>
            )}

            {message.think && (
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
            )}
          </div>
        )}

        {isThinkingModel && message.think && (
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
