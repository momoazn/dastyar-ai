import { memo, useMemo } from 'react';
import { AssistantMessage } from '@/components/assistant-message';
import { UserMessage } from '@/components/user-message';
import type { MyUIMessage } from '@/server/utils/chat';

export interface MessageProps {
  message: MyUIMessage;
  status?: string;
}

export const Message = memo(({ message, status }: MessageProps) => {
  const normalized = useMemo(() => {
    let content = '';
    let reasoning = '';
    for (const part of (message.parts ?? []) as {
      type: string;
      text?: string;
    }[]) {
      if (part.type === 'text' && part.text) {
        content += part.text;
      }
      if (part.type === 'reasoning' && part.text) {
        reasoning += part.text;
      }
    }
    return {
      role: message.role,
      content,
      reasoning,
      model: message.metadata?.modelId ?? undefined,
      status,
    };
  }, [message, status]);

  const isUser = normalized.role === 'user';
  return isUser ? (
    <UserMessage message={normalized} />
  ) : (
    <AssistantMessage message={normalized} />
  );
});
