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
export function ToolScaffold({
  toolbar,
  alerts,
  content,
  actionBar,
  dir = "rtl",
}: ToolScaffoldProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto" dir={dir}>
      {toolbar ? (
        <div className="border-b bg-background/95 p-4 backdrop-blur">
          {toolbar}
        </div>
      ) : null}
      <div className="mx-auto w-full max-w-6xl flex-1 space-y-5 p-4 md:p-6">
        {alerts}
        {content}
        {actionBar ? <div className="flex justify-end">{actionBar}</div> : null}
      </div>
    </div>
  );
}
