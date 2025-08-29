import { memo, useMemo } from 'react';
import { AssistantMessage } from '@/components/chat/assistant-message';
import { UserMessage } from '@/components/chat/user-message';
import type { MyUIMessage } from '@/server/utils/chat';

export type MessageGenerationStatus =
  | 'idle'
  | 'streaming'
  | 'reasoning'
  | 'submitted'
  | 'stopped'
  | 'errored'
  | undefined;

export type MessageViewModel = {
  role: MyUIMessage['role'];
  content?: string;
  reasoning?: string;
  model?: string;
  status?: MessageGenerationStatus;
  sent_at?: string;
  created?: string;
};

export interface MessageProps {
  message: MyUIMessage;
}

export const toMessageViewModel = (message: MyUIMessage): MessageViewModel => {
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
    model:
      message.metadata?.modelName ?? message.metadata?.modelId ?? undefined,
  };
};

export const Message = memo(({ message }: MessageProps) => {
  const normalized = useMemo(() => toMessageViewModel(message), [message]);

  const isUser = normalized.role === 'user';
  return isUser ? (
    <UserMessage message={normalized} />
  ) : (
    <AssistantMessage message={normalized} />
  );
});
