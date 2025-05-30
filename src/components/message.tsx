import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { cn, detectTextDirection } from "@/lib/utils";
import { Eye, EyeOff, Loader2, StopCircle } from "lucide-react";
import {
  MessagesRecord,
  MessagesRoleOptions,
  MessagesStatusOptions,
} from "@/lib/pocketbase-types";

const THINKING_MODELS = ["deepseek-r1", "deepscaler"];

const isThinkingModel = (model: string) => {
  return THINKING_MODELS.find((m) => model.includes(m)) !== undefined;
};

export interface MessageProps {
  message: MessagesRecord;
}

export function Message({ message }: MessageProps) {
  const [collapsed, setCollapsed] = useState(false);

  const hasThinking =
    message?.role === MessagesRoleOptions.assistant &&
    message?.reasoning !== "" &&
    message?.model &&
    isThinkingModel(message.model);

  const isUser = message.role === MessagesRoleOptions.user;
  const isStopped =
    message.status === MessagesStatusOptions.finished ||
    message.status === MessagesStatusOptions.errored;
  const isGenerating =
    message.status === MessagesStatusOptions.idle ||
    message.status === MessagesStatusOptions.streaming ||
    message.status === MessagesStatusOptions.reasoning;

  // User message with bubble
  if (isUser) {
    return (
      <div className="flex w-full justify-end">
        <div className="max-w-[85%] rounded-2xl bg-blue-600 px-4 py-3 text-white">
          <div
            dir={detectTextDirection(message.content || "")}
            className="text-sm leading-relaxed"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
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
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
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
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
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
