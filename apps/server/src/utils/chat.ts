import type { UIDataTypes, UIMessage, UIMessagePart, UITools } from 'ai';
import type { Message } from '@/database';
import type { MessageRole } from './constants';

export type MyUIMessage = UIMessage<
  { modelId: number; threadId: number },
  UIDataTypes,
  UITools
>;

export const convertDbMessagesToUiMessages = (
  messages: Message[]
): MyUIMessage[] => {
  return messages.map((message) => ({
    id: message.id.toString(),
    role: message.role as MessageRole,
    parts: message.parts as UIMessagePart<UIDataTypes, UITools>[],
    metadata: {
      modelId: message.modelId,
      threadId: message.threadId,
    },
  }));
};
