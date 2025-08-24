import type { UIDataTypes, UIMessage, UIMessagePart, UITools } from 'ai';
import type { MessageRole, SelectMessageOutput } from '../database/schema';

export const findLastUserMessage = (messages: UIMessage[]) => {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      return messages[i];
    }
  }
  return null;
};

export const convertDbMessagesToUiMessages = (
  messages: SelectMessageOutput[]
): UIMessage[] => {
  return messages.map((message) => ({
    id: message.id,
    role: message.role as MessageRole,
    parts: message.parts as UIMessagePart<UIDataTypes, UITools>[],
  }));
};
