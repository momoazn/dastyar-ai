import { memo } from "react";
import { AssistantMessage } from "./assistant-message";
import { UserMessage } from "./user-message";

export interface MessageProps {
  message: {
    role: string;
    content?: string;
    model?: string;
    status?: string;
    sent_at?: string;
    reasoning?: string;
    created?: string;
  };
}

export const Message = memo(({ message }: MessageProps) => {
  const isUser = message.role === "user";
  return isUser ? (
    <UserMessage message={message} />
  ) : (
    <AssistantMessage message={message} />
  );
});
