import type { UIMessage } from 'ai';
import { Loader2 } from 'lucide-react';
import { Message, MessageContent } from '@/components/ai-elements/message';
import { Response } from '@/components/ai-elements/response';
import { NoMessages } from '@/components/no-messages';
import { Skeleton } from '@/components/ui';
import { PERSIAN_TEXTS } from '@/lib/persian-texts';

type ParsedMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  reasoning: string;
};

function parseMessage(message: UIMessage): ParsedMessage {
  let text = '';
  let reasoning = '';
  for (const part of message.parts as { type: string; text?: string }[]) {
    if (part.type === 'text' && part.text) {
      text += part.text;
    }
    if (part.type === 'reasoning' && part.text) {
      reasoning += part.text;
    }
  }
  const role: 'user' | 'assistant' =
    message.role === 'user' ? 'user' : 'assistant';
  return { id: message.id, role, text, reasoning };
}

export function MessagesList({
  messages,
  isSubmitted,
}: {
  messages: UIMessage[];
  isSubmitted: boolean;
}) {
  if (messages.length > 0) {
    const parsed: ParsedMessage[] = messages.map((m) => parseMessage(m));

    return (
      <div className="space-y-2" dir="rtl">
        {parsed.map((m) => (
          <Message from={m.role} key={m.id}>
            {m.role === 'assistant' ? (
              <MessageContent className="w-full" variant="plain">
                <Response>{m.text}</Response>
              </MessageContent>
            ) : (
              <MessageContent>
                <Response>{m.text}</Response>
              </MessageContent>
            )}
          </Message>
        ))}
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex w-full max-w-2xl flex-col gap-2">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        </div>
        <output
          aria-live="polite"
          className="flex items-center gap-3 px-11 text-muted-foreground text-xs"
        >
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>{PERSIAN_TEXTS.general.loading}...</span>
        </output>
      </div>
    );
  }

  return <NoMessages className="min-h-[65vh] md:min-h-[75vh]" />;
}
