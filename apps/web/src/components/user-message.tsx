import { Check, Copy } from 'lucide-react';
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
import { detectTextDirection } from '@/lib/utils';

export interface UserMessageProps {
  message: {
    role: string;
    content?: string;
    created?: string;
  };
}

export const UserMessage = memo(({ message }: UserMessageProps) => {
  const [copySuccess, setCopySuccess] = useState(false);

  const textDirection = useMemo(
    () => detectTextDirection(message.content || ''),
    [message.content]
  );

  const formattedTime = useMemo(() => {
    if (!message.created) {
      return null;
    }
    return new Date(message.created).toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [message.created]);

  const handleCopy = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      setCopySuccess(false);
    }
  }, []);

  return (
    <div className="group fade-in-50 slide-in-from-left-2 flex w-full animate-in justify-end duration-300">
      <div className="max-w-[85%] sm:max-w-[75%] lg:max-w-[65%]">
        <div className="relative">
          <div
            className="relative rounded-lg rounded-br-sm border border-primary/20 bg-primary px-4 py-3 text-primary-foreground text-sm leading-relaxed shadow-md transition-all duration-200 hover:shadow-lg"
            dir={textDirection}
          >
            <div className="pointer-events-none absolute inset-0 rounded-lg rounded-br-sm bg-gradient-to-br from-white/8 to-black/5" />

            <div className="relative z-10 whitespace-pre-wrap break-words">
              <Streamdown>{message.content || ''}</Streamdown>
            </div>
          </div>
        </div>

        <div className="mt-1 flex items-center justify-between gap-3">
          <time className="font-medium text-muted-foreground/80 text-xs">
            {formattedTime}
          </time>

          <TooltipProvider>
            <div className="translate-y-1 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="h-7 w-7 rounded-full p-0 transition-all duration-200 hover:scale-105 hover:bg-accent hover:text-accent-foreground"
                    onClick={() => handleCopy(message.content || '')}
                    size="sm"
                    variant="ghost"
                  >
                    {copySuccess ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p className="text-xs">
                    {copySuccess ? fa.chat.copied : fa.chat.copy}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
});
