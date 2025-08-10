import type { UIMessage } from 'ai';
import { Loader2 } from 'lucide-react';
import { AssistantMessage } from '@/components/assistant-message';
import { NoMessages } from '@/components/no-messages';
import { Skeleton } from '@/components/ui';
import { UserMessage } from '@/components/user-message';
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
      <div className="space-y-4">
        {parsed.map((m) =>
          m.role === 'user' ? (
            <UserMessage
              key={m.id}
              message={{ role: 'user', content: m.text }}
            />
          ) : (
            <AssistantMessage
              key={m.id}
              message={{
                role: 'assistant',
                content: m.text,
                reasoning: m.reasoning,
              }}
            />
          )
        )}
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
