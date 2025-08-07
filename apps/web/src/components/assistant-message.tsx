import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { cn, detectTextDirection } from "@/lib/utils";

import {
  AlertCircle,
  Bot,
  Check,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  StopCircle,
} from "lucide-react";
import { memo, useCallback, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface AssistantMessageProps {
  message: {
    role: string;
    content?: string;
    model?: string;
    status?: string;
    sent_at?: string;
    reasoning?: string;
  };
}

export const AssistantMessage = memo(({ message }: AssistantMessageProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Memoize expensive computations
  const hasThinking = useMemo(() => {
    return (
      message?.role === "assistant" && message?.content !== "" && message?.model
    );
  }, [message?.role, message?.content, message?.model]);

  const messageStatus = useMemo(() => {
    const isStopped = message.status === "stopped";
    const isErrored = message.status === "errored";
    const isGenerating =
      message.status === "idle" ||
      message.status === "streaming" ||
      message.status === "reasoning";

    return { isStopped, isErrored, isGenerating };
  }, [message.status]);

  const textDirection = useMemo(
    () => detectTextDirection(message.content || ""),
    [message.content]
  );

  const formattedTime = useMemo(() => {
    if (!message.sent_at) return null;
    return new Date(message.sent_at).toLocaleTimeString("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [message.sent_at]);

  const handleCopy = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => !c);
  }, []);

  const AssistantMessageActions = useMemo(
    () => (
      <TooltipProvider>
        <div className="mt-2 flex items-center gap-1 opacity-0 transition-all duration-200 group-hover:opacity-100">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-accent hover:text-accent-foreground h-8 w-8 rounded-lg p-0"
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

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-accent hover:text-accent-foreground h-8 w-8 rounded-lg p-0"
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
    [copySuccess, handleCopy, message.content, message.model]
  );

  const { isStopped, isErrored, isGenerating } = messageStatus;

  return (
    <div className="group animate-in fade-in-50 slide-in-from-bottom-2 w-full duration-500">
      {/* Thinking section */}
      {hasThinking && (
        <div className="mb-2 rounded-xl border border-amber-200/50 bg-gradient-to-r from-amber-50/50 to-yellow-50/50 p-3 shadow-sm dark:border-amber-800/30 dark:from-amber-950/20 dark:to-yellow-950/20">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
                <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
              </div>
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                💭 فرآیند تفکر
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-3 text-xs text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/50"
              onClick={toggleCollapsed}
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
            <div className="rounded-lg bg-white/50 p-3 dark:bg-black/20">
              <div
                dir={detectTextDirection(message.reasoning || "")}
                className="text-justify text-sm leading-relaxed text-amber-800 dark:text-amber-200"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.reasoning || ""}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}

      {isGenerating && (
        <div className="mb-4 flex items-center gap-2">
          <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
          <span className="text-muted-foreground text-sm">
            در حال تولید پاسخ...
          </span>
        </div>
      )}

      {(message.content || !isGenerating) && (
        <div className="w-full">
          <div dir={textDirection} className="w-full">
            <div className="prose prose-sm text-foreground max-w-none">
              <div className="text-justify leading-relaxed">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h2: ({ children }) => (
                      <h3 className="text-foreground mt-4 mb-2 text-lg font-semibold">
                        {children}
                      </h3>
                    ),
                    h3: ({ children }) => (
                      <h4 className="text-foreground mt-3 mb-2 text-base font-semibold">
                        {children}
                      </h4>
                    ),
                    strong: ({ children }) => (
                      <strong className="text-primary font-semibold">
                        {children}
                      </strong>
                    ),
                    li: ({ children }) => (
                      <div className="my-1 flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{children}</span>
                      </div>
                    ),
                    p: ({ children }) => <div className="mb-3">{children}</div>,
                    code: ({ children, ...props }) => {
                      const isInline = !String(props.className || "").includes(
                        "language-"
                      );
                      return isInline ? (
                        <code className="bg-muted text-primary rounded px-1.5 py-0.5 font-mono text-sm">
                          {children}
                        </code>
                      ) : (
                        <pre className="bg-muted overflow-x-auto rounded-lg p-3">
                          <code className="font-mono text-sm">{children}</code>
                        </pre>
                      );
                    },
                  }}
                >
                  {message.content || ""}
                </ReactMarkdown>
              </div>
            </div>

            {isStopped && (
              <div className="text-muted-foreground mt-4 flex items-center gap-2 text-xs">
                <StopCircle className="h-3 w-3" />
                <span>{PERSIAN_TEXTS.chat.generationStopped}</span>
              </div>
            )}

            {isErrored && (
              <div className="text-muted-foreground mt-4 flex items-center gap-2 text-xs">
                <AlertCircle className="h-3 w-3" />
                <span>{PERSIAN_TEXTS.chat.generationErrored}</span>
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
