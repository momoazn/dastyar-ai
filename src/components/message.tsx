import { MessagesRecord, MessagesRoleOptions } from "@/lib/pocketbase-types";
import { memo } from "react";
import { AssistantMessage } from "./assistant-message";
import { UserMessage } from "./user-message";

export interface MessageProps {
  message: MessagesRecord;
}

export const Message = memo(({ message }: MessageProps) => {
  const isUser = message.role === MessagesRoleOptions.user;

  if (isUser) {
    return <UserMessage message={message} />;
  }

  return <AssistantMessage message={message} />;
});
