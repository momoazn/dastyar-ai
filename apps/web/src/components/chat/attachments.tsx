import { useMutation, useQuery } from "@tanstack/react-query";
import { FileText, Loader2, X } from "lucide-react";
import { memo } from "react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { orpc, queryClient } from "@/utils/orpc";

export type PendingAttachment = {
  filename: string;
  phase: "extracting" | "uploading" | "indexing";
};

type Props = {
  threadId: number;
  className?: string;
  pending?: PendingAttachment[];
};

export const ChatAttachments = memo(
  ({ threadId, className, pending }: Props) => {
    const { data: docs } = useQuery(
      orpc.documents.listByThread.queryOptions({
        input: { threadId },
        enabled: Boolean(threadId),
      })
    );

    const { mutateAsync: detach } = useMutation(
      orpc.documents.detachFromThread.mutationOptions({
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: orpc.documents.listByThread.queryKey({
              input: { threadId },
            }),
          });
        },
      })
    );

    const hasPending = Boolean(pending && pending.length > 0);
    const hasDocs = Boolean(docs && docs.length > 0);
    if (!(hasPending || hasDocs)) {
      return null;
    }

    return (
      <div className={cn("mb-2 flex flex-col gap-2", className)} dir="rtl">
        {(pending || []).map((p) => (
          <div
            className="flex items-center justify-between rounded-2xl border bg-muted/30 px-3 py-2 text-sm dark:bg-muted/10"
            key={`pending-${p.filename}-${p.phase}`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background shadow-sm">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
              <div className="min-w-0">
                <div className="truncate font-medium">{p.filename}</div>
                <div className="text-muted-foreground text-xs">
                  {phaseLabel(p.phase)}
                </div>
              </div>
            </div>
          </div>
        ))}

        {(docs || []).map((d) => (
          <div
            className="flex items-center justify-between rounded-2xl border bg-muted/40 px-3 py-2 text-sm dark:bg-muted/20"
            key={d.id}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background shadow-sm">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="truncate font-medium">{d.title}</div>
                <div className="text-muted-foreground text-xs">
                  {mimeToPretty(d.mimeType)}
                </div>
              </div>
            </div>

            <Button
              className="ms-3 h-7 w-7 rounded-full p-0"
              onClick={() => detach({ threadId, documentId: Number(d.id) })}
              size="icon"
              variant="ghost"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    );
  }
);

function mimeToPretty(mime: string): string {
  if (!mime) {
    return "";
  }
  if (mime.includes("pdf")) {
    return "PDF";
  }
  if (mime.includes("markdown")) {
    return "Markdown";
  }
  if (mime.includes("text")) {
    return "Text";
  }
  return mime;
}

function phaseLabel(phase: PendingAttachment["phase"]): string {
  switch (phase) {
    case "extracting":
      return "استخراج متن از PDF...";
    case "uploading":
      return "در حال بارگذاری...";
    case "indexing":
      return "در حال ایندکس...";
    default:
      return "";
  }
}
