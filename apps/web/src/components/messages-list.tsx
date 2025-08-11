import type { UIMessage } from 'ai';
import { Message, MessageContent } from '@/components/ai-elements/message';
import { Response } from '@/components/ai-elements/response';
import { NoMessages } from '@/components/no-messages';
import { Skeleton } from '@/components/ui';
import { detectTextDirection } from '@/lib/utils';

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
  isLoadingAssistant,
}: {
  messages: UIMessage[];
  isLoadingAssistant?: boolean;
}) {
  if (messages.length > 0) {
    const parsed: ParsedMessage[] = messages.map((m) => parseMessage(m));
    const last = parsed.at(-1);
    const showInlineSkeleton = Boolean(
      isLoadingAssistant &&
        (!last ||
          last.role === 'user' ||
          (last.role === 'assistant' && !last.text && !last.reasoning))
    );

    return (
      <div className="space-y-2" dir="rtl">
        {parsed.map((m) => {
          const direction = m.text ? detectTextDirection(m.text) : 'rtl';
          return (
            <Message from={m.role} key={m.id}>
              {m.role === 'assistant' ? (
                <MessageContent
                  className="w-full"
                  dir={direction}
                  variant="plain"
                >
                  <Response>{m.text}</Response>
                </MessageContent>
              ) : (
                <MessageContent dir={direction}>
                  <Response>{m.text}</Response>
                </MessageContent>
              )}
            </Message>
          );
        })}
        {showInlineSkeleton ? (
          <Message from="assistant">
            <MessageContent className="w-full" dir="rtl" variant="plain">
              <Skeleton className="h-4 w-3/5" />
            </MessageContent>
          </Message>
        ) : null}
      </div>
    );
  }

  if (isLoadingAssistant) {
    return (
      <div className="space-y-2" dir="rtl">
        <Message from="assistant">
          <MessageContent className="w-full" dir="rtl" variant="plain">
            <Skeleton className="h-4 w-3/5" />
          </MessageContent>
        </Message>
      </div>
    );
  }

  return <NoMessages className="min-h-[65vh] md:min-h-[75vh]" />;
}
