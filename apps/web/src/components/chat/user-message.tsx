import { memo } from "react";
import { Streamdown } from "streamdown";
import {
  CopyMessageButton,
  formatMessageTime,
} from "@/components/chat/message-actions";
import { detectTextDirection } from "@/lib/utils";

export type UserMessageProps = {
  message: {
    role: string;
    content?: string;
    created?: string;
  };
};

export const UserMessage = memo(({ message }: UserMessageProps) => {
  const textDirection = detectTextDirection(message.content || "");
  const formattedTime = formatMessageTime(message.created);

  return (
    <div className="group fade-in-50 mt-8 flex w-full animate-in justify-start duration-300">
      <div className="max-w-[85%] sm:max-w-[75%] lg:max-w-[65%]">
        <div className="relative">
          <div
            className="relative rounded-lg rounded-br-sm border border-primary/20 bg-primary px-4 py-3 text-primary-foreground text-sm leading-relaxed shadow-md transition-all duration-200 hover:shadow-lg"
            dir={textDirection}
          >
            <div className="pointer-events-none absolute inset-0 rounded-lg rounded-br-sm bg-gradient-to-br from-white/8 to-black/5" />

            <div className="relative z-10 whitespace-pre-wrap break-words">
              <Streamdown>{message.content || ""}</Streamdown>
            </div>
          </div>
        </div>

        <div className="mt-1 flex items-center justify-between gap-3">
          <time className="font-medium text-muted-foreground/80 text-xs">
            {formattedTime}
          </time>

          <div className="translate-y-1 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
            <CopyMessageButton
              className="h-7 w-7 rounded-full p-0 transition-all duration-200 hover:scale-105 hover:bg-accent hover:text-accent-foreground"
              content={message.content}
              iconClassName="h-3.5 w-3.5"
              tooltipSide="left"
            />
          </div>
        </div>
      </div>
    </div>
  );
});
