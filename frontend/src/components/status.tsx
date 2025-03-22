import { useChatHealthCheck } from "@/lib/api";
import { useConversations } from "@/lib/api/chat";
import {
  Brain,
  CloudIcon,
  ImageIcon,
  LucideIcon,
  MessageCircle,
} from "lucide-react";

export function Status() {
  const { data: healthCheck } = useChatHealthCheck();
  const { isError: isConversationsError } = useConversations();

  return (
    <header className="flex gap-2">
      <StatusItem
        name="Chat"
        icon={MessageCircle}
        status={!isConversationsError}
      />
      <StatusItem
        name="Ollama"
        icon={Brain}
        status={healthCheck?.data === "ok"}
      />

      <StatusItem name="Whisper" icon={CloudIcon} status={false} />
      <StatusItem name="Stable Diffusion" icon={ImageIcon} status={false} />
    </header>
  );
}

function StatusItem({
  name,
  icon: Icon,
  status,
}: {
  name: string;
  icon: LucideIcon;
  status: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded px-2 py-1.5 ${
        status ? "bg-green-600/10 text-green-600" : "bg-red-600/10 text-red-600"
      }`}
    >
      <span className="mt-0.5 hidden text-xs lg:block">{name}</span>
      <Icon className="h-4 w-4" />
    </div>
  );
}
