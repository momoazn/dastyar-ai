import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui";
import type { DbMessage as MessageType } from "../../generated/apiSchemas";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { cn, detectTextDirection } from "@/lib/utils";
import { BotIcon, Loader2, UserIcon } from "lucide-react";

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
    isThinkingModel(message?.llm ?? "");

  return (
    <div
      id={`message-${message.id}`}
      className={cn(
        "flex pr-4",
        message.role === "assistant" ? "justify-start" : "justify-end",
      )}
    >
      {/* Message bubble */}
      <div
        dir={detectTextDirection(message.content)}
        className={cn(
          "flex max-w-[85%] flex-col space-y-3 rounded-md p-4 shadow-xs transition-colors",
          message.role === "assistant"
            ? "bg-slate-300 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
            : "bg-primary text-primary-foreground dark:bg-blue-600 dark:text-white",
        )}
      >
        {/* Message header */}
        <div
          className={cn(
            "rtl flex w-full items-center",
            message.role === "user"
              ? "justify-start"
              : hasThinking
                ? "justify-between"
                : "justify-end",
          )}
        >
          {/* Toggle thoughts button */}
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

          {/* Message icon */}
          {message.role === "assistant" ? (
            <BotIcon className="h-4 w-4" />
          ) : (
            <UserIcon className="h-4 w-4" />
          )}
        </div>

        {/* Thoughts */}
        {hasThinking && (
          <div
            dir="ltr"
            className={cn(
              "border-muted text-muted-foreground overflow-hidden border-l-2 pl-3 text-sm transition-all duration-200 ease-in-out dark:text-slate-400",
              collapsed
                ? "mt-0 max-h-0 opacity-0"
                : "mt-2 max-h-[500px] opacity-100",
            )}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.reasoning}
            </ReactMarkdown>
          </div>
        )}

        {/* Waiting for first chunk */}
        {message.status === "idle" && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}

        {/* Message content */}
        <article
          className={cn(
            "prose dark:prose-pre:bg-slate-900 max-w-none break-words",
            message.role === "user"
              ? "prose-invert dark:prose-headings:text-white dark:prose-a:text-blue-300"
              : "dark:prose-headings:text-white dark:prose-a:text-blue-400 dark:text-slate-100",
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
