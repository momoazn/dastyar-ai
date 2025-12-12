import { FileText, ListChecks, Sparkles } from "lucide-react";
import { Button } from "@/components/ui";
import { Label } from "@/components/ui/label";
import { fa } from "@/lib/persian-texts";

type SmartActionMode = "action-items" | "meeting-notes" | "concise";

type SmartActionsToolbarProps = {
  onAction: (mode: SmartActionMode) => void;
  disabled: boolean;
};

export function SmartActionsToolbar({
  onAction,
  disabled,
}: SmartActionsToolbarProps) {
  return (
    <div className="fade-in slide-in-from-top-2 animate-in pt-4">
      <Label className="mb-3 block font-medium text-muted-foreground text-sm">
        {fa.transcribe.smartActions.title}
      </Label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Button
          className="h-auto flex-col gap-2 py-3"
          disabled={disabled}
          onClick={() => onAction("concise")}
          variant="outline"
        >
          <Sparkles className="size-4 text-amber-500" />
          <span className="text-xs">
            {fa.transcribe.smartActions.summarize}
          </span>
        </Button>
        <Button
          className="h-auto flex-col gap-2 py-3"
          disabled={disabled}
          onClick={() => onAction("action-items")}
          variant="outline"
        >
          <ListChecks className="size-4 text-blue-500" />
          <span className="text-xs">
            {fa.transcribe.smartActions.actionItems}
          </span>
        </Button>
        <Button
          className="h-auto flex-col gap-2 py-3"
          disabled={disabled}
          onClick={() => onAction("meeting-notes")}
          variant="outline"
        >
          <FileText className="size-4 text-green-500" />
          <span className="text-xs">
            {fa.transcribe.smartActions.meetingNotes}
          </span>
        </Button>
      </div>
    </div>
  );
}
