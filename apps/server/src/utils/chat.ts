import type { UIDataTypes, UIMessage, UIMessagePart, UITools } from 'ai';
import type { MessageRole, SelectMessageOutput } from '../database/schema';

export type MyUIMessage = UIMessage<
  { modelId: string | null; modelName?: string; threadId: string },
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
  messages: (SelectMessageOutput & { modelName?: string })[]
): MyUIMessage[] => {
  return messages.map((message) => ({
    id: message.id,
    role: message.role as MessageRole,
    parts: message.parts as UIMessagePart<UIDataTypes, UITools>[],
    metadata: {
      modelId: message.modelId,
      modelName: message.modelName,
      threadId: message.threadId,
    },
  }));
};
