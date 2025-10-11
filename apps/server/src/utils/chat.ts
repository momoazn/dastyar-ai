import type { UIDataTypes, UIMessage, UIMessagePart, UITools } from 'ai';
import type { MessageWithModel } from '@/repositories/threads';
import type { MessageRole } from './constants';

export type MyUIMessage = UIMessage<
  { modelId: number; threadId: number; modelName?: string },
  UIDataTypes,
  UITools
>;

export const convertDbMessagesToUiMessages = (
  messages: MessageWithModel[]
): MyUIMessage[] => {
  return messages.map((message) => ({
    id: message.id.toString(),
    role: message.role as MessageRole,
    parts: message.parts as UIMessagePart<UIDataTypes, UITools>[],
    metadata: {
      modelId: message.modelId,
      threadId: message.threadId,
      modelName: message.model?.name,
    },
  }));
};
