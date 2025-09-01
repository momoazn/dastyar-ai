import type { UIDataTypes, UIMessage, UIMessagePart, UITools } from 'ai';
import type { SelectMessageOutput } from '@/database/schema';
import type { MessageRole } from './constants';

export type MyUIMessage = UIMessage<
  { modelName: string; threadId: string },
  UIDataTypes,
  UITools
>;

export const findLastUserMessage = (messages: MyUIMessage[]) => {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      return messages[i];
    }
  }
  return null;
};

export const convertDbMessagesToUiMessages = (
  messages: SelectMessageOutput[]
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
