import {
  AlertCircle,
  Bot,
  Check,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  StopCircle,
} from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';
import { Streamdown } from 'streamdown';
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui';
import { fa } from '@/lib/persian-texts';
import { cn, detectTextDirection } from '@/lib/utils';

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

  const hasThinking = useMemo(() => {
    return message?.role === 'assistant' && Boolean(message?.reasoning?.trim());
  }, [message?.role, message?.reasoning]);

  const messageStatus = useMemo(() => {
    const stopped = message.status === 'stopped';
    const errored = message.status === 'errored';
    const generating =
      message.status === 'idle' ||
      message.status === 'streaming' ||
      message.status === 'reasoning' ||
      message.status === 'submitted';

    return { isStopped: stopped, isErrored: errored, isGenerating: generating };
  }, [message.status]);

  const textDirection = useMemo(
    () => detectTextDirection(message.content || ''),
    [message.content]
  );

  const formattedTime = useMemo(() => {
    if (!message.sent_at) {
      return null;
    }
    return new Date(message.sent_at).toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [message.sent_at]);

  const handleCopy = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (_error) {
      setCopySuccess(false);
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
                className="h-8 w-8 rounded-lg p-0 hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleCopy(message.content || '')}
                size="sm"
                variant="ghost"
              >
                {copySuccess ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{copySuccess ? fa.chat.copied : fa.chat.copy}</p>
            </TooltipContent>
          </Tooltip>

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
              <p>{message.model || 'Unknown Model'}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    ),
    [copySuccess, handleCopy, message.content, message.model]
  );

  const { isStopped, isErrored, isGenerating } = messageStatus;

  return (
    <div className="group fade-in-50 slide-in-from-bottom-2 w-full animate-in duration-500">
      {hasThinking && (
        <div className="mb-2 rounded-xl border border-amber-200/50 bg-gradient-to-r from-amber-50/50 to-yellow-50/50 p-3 shadow-sm dark:border-amber-800/30 dark:from-amber-950/20 dark:to-yellow-950/20">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
                <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
              </div>
              <span className="font-medium text-amber-700 text-sm dark:text-amber-300">
                💭 فرآیند تفکر
              </span>
            </div>

            <Button
              className="h-7 px-3 text-amber-600 text-xs hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/50"
              onClick={toggleCollapsed}
              size="sm"
              variant="ghost"
            >
              {collapsed ? (
                <Eye className="ml-1 h-3 w-3" />
              ) : (
                <EyeOff className="ml-1 h-3 w-3" />
              )}{' '}
              {collapsed ? 'نمایش' : 'پنهان'}
            </Button>
          </div>

          <div
            className={cn(
              'overflow-hidden transition-all duration-300 ease-in-out',
              collapsed ? 'max-h-0 opacity-0' : 'max-h-[400px] opacity-100'
            )}
          >
            <div className="rounded-lg bg-white/50 p-3 dark:bg-black/20">
              <div
                className="text-justify text-amber-800 text-sm leading-relaxed dark:text-amber-200"
                dir={detectTextDirection(message.reasoning || '')}
              >
                <Streamdown>{message.reasoning || ''}</Streamdown>
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
                <Streamdown>{message.content || ''}</Streamdown>
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
