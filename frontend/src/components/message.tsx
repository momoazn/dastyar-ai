import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { Message } from "@/lib/api/chat";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { cn, detectTextDirection } from "@/lib/utils";
import { Button } from "./ui/button";

const THINKING_MODELS = ["deepseek-r1", "deepscaler"];

const isThinkingModel = (model: string) => {
  return THINKING_MODELS.find((m) => model.includes(m)) !== undefined;
};

export interface MessageProps {
  message: Message;
}

export function Message({ message }: MessageProps) {
  const [collapsed, setCollapsed] = useState(false);

  const hasThinking =
    message?.role === "assistant" &&
    message?.think !== "" &&
    isThinkingModel(message?.model ?? "");

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

          {hasThinking && (
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

        {hasThinking && (
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

        {/* Waiting for first chunk */}
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
