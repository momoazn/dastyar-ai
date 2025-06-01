import { MessagesRecord, MessagesRoleOptions } from "@/lib/pocketbase-types";
import { AssistantMessage } from "./assistant-message";
import { UserMessage } from "./user-message";

export interface MessageProps {
  message: MessagesRecord;
}

export function Message({ message }: MessageProps) {
  const isUser = message.role === MessagesRoleOptions.user;

  if (isUser) {
    return <UserMessage message={message} />;
  }

  return <AssistantMessage message={message} />;
}
