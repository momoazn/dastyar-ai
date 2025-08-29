import { Message } from '@/components/message';
import { NoMessages } from '@/components/no-messages';
import { Skeleton } from '@/components/ui';
import type { MyUIMessage } from '@/server/utils/chat';

type ParsedMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  reasoning: string;
};

function parseMessage(message: MyUIMessage): ParsedMessage {
  let text = '';
  let reasoning = '';
  for (const part of message.parts) {
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
  messages: MyUIMessage[];
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
      <div className="space-y-4" dir="rtl">
        {messages.map((m, idx) => {
          return (
            <div
              className={m.role === 'user' ? 'flex justify-end' : ''}
              key={m.id}
            >
              <Message
                message={m}
                status={idx === messages.length - 1 ? 'submitted' : undefined}
              />
            </div>
          );
        })}
        {showInlineSkeleton ? (
          <div>
            <Skeleton className="h-4 w-3/5" />
          </div>
        ) : null}
      </div>
    );
  }

  if (isLoadingAssistant) {
    return (
      <div className="space-y-4" dir="rtl">
        <Skeleton className="h-4 w-3/5" />
      </div>
    );
  }

  return <NoMessages className="min-h-[65vh] md:min-h-[75vh]" />;
}
