import { MessagesRecord, MessagesRoleOptions } from "@/lib/pocketbase-types";
import { AssistantMessage } from "./assistant-message";
import { UserMessage } from "./user-message";

export interface MessageProps {
  message: MessagesRecord;
  onCopy?: (content: string) => void;
}

export function Message({ message, onCopy }: MessageProps) {
  const isUser = message.role === MessagesRoleOptions.user;

  if (isUser) {
    return <UserMessage message={message} onCopy={onCopy} />;
  }

  return <AssistantMessage message={message} onCopy={onCopy} />;
}
