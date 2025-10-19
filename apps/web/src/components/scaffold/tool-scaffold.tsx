import type { ReactNode } from "react";

type ToolScaffoldProps = {
  toolbar?: ReactNode;
  alerts?: ReactNode;
  content?: ReactNode;
  actionBar?: ReactNode;
  dir?: "rtl" | "ltr";
};

/**
 * ToolScaffold
 *
 * Provides a consistent page shell for tool-style pages (e.g., translate,
 * summarize, transcribe, code). It standardizes paddings, spacing, and the
 * vertical layout across routes without constraining the inner card structure.
 */
export const ToolScaffold = ({
  toolbar,
  alerts,
  content,
  actionBar,
  dir = "rtl",
}: ToolScaffoldProps) => (
  <div className="flex h-full flex-col" dir={dir}>
    {toolbar ? <div className="bg-background p-4">{toolbar}</div> : null}
    <div className="flex-1 space-y-4 p-4">
      {alerts}
      {content}
      {actionBar ? <div className="flex justify-end">{actionBar}</div> : null}
    </div>
  </div>
);

export default ToolScaffold;
