import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { LoadingSpinner } from "./ui/loading-spinner";

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rtl">
        <DialogHeader>
          <DialogTitle>{PERSIAN_TEXTS.deleteDialog.title}</DialogTitle>
          <DialogDescription className="mt-8 whitespace-pre-line">
            {PERSIAN_TEXTS.deleteDialog.description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <LoadingSpinner className="h-4 w-4" />
            ) : (
              PERSIAN_TEXTS.ui.delete
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            {PERSIAN_TEXTS.ui.cancel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
