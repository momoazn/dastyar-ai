import type { Message } from '@prisma/client';
import type { UIDataTypes, UIMessage, UIMessagePart, UITools } from 'ai';
import type { MessageRole } from './constants';

export type MyUIMessage = UIMessage<
  { modelName: string; threadId: string },
  UIDataTypes,
  UITools
>;

export const convertDbMessagesToUiMessages = (
  messages: Message[]
): MyUIMessage[] => {
  return messages.map((message) => ({
    id: message.id,
    role: message.role as MessageRole,
    parts: message.parts as UIMessagePart<UIDataTypes, UITools>[],
    metadata: {
      modelName: message.modelName,
      threadId: message.threadId,
    },
  }));
};
