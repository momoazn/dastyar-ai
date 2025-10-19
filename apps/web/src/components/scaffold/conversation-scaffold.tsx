import type { ReactNode } from "react";

type ConversationScaffoldProps = {
  banner?: ReactNode;
  empty?: ReactNode;
  conversation?: ReactNode;
  isEmpty: boolean;
  footer: ReactNode;
  dir?: "rtl" | "ltr";
};

/**
 * ConversationScaffold
 *
 * Unifies the layout for chat-like pages with a scrollable conversation area
 * and a sticky footer composer. Keeps optional banner space for service
 * announcements or contextual alerts.
 */
export const ConversationScaffold = ({
  banner,
  empty,
  conversation,
  isEmpty,
  footer,
  dir = "rtl",
}: ConversationScaffoldProps) => (
  <div className="flex h-full flex-col" dir={dir}>
    {banner ? <div className="p-3">{banner}</div> : null}
    <div className="flex-1 overflow-hidden">
      {isEmpty ? empty : conversation}
    </div>
    <div className="sticky bottom-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {footer}
    </div>
  </div>
);

export default ConversationScaffold;
