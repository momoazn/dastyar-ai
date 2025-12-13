import { AlertCircle } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { fa } from "@/lib/persian-texts";
import type { User } from "@/types/database";

type DeleteUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  isLoading: boolean;
  onConfirm: () => void;
};

export function DeleteUserDialog({
  open,
  onOpenChange,
  user,
  isLoading,
  onConfirm,
}: DeleteUserDialogProps) {
  const [confirmText, setConfirmText] = useState("");

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setConfirmText("");
    }
    onOpenChange(newOpen);
  };

  const isConfirmValid =
    confirmText === "DELETE" || confirmText === fa.sidebar.actions.delete;

  if (!user) {
    return null;
  }

  return (
    <AlertDialog onOpenChange={handleOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader className="text-right">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>
              {fa.admin.users.actions.confirmDeleteUser}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3">
            <p>
              {fa.admin.users.actions.confirmDeleteUserMessage(user.username)}
            </p>
            <p className="text-muted-foreground text-sm">
              {fa.admin.users.actions.confirmDeleteUserWarning}
            </p>
            <div className="space-y-2">
              <label className="font-medium text-sm" htmlFor="confirmText">
                {fa.admin.users.actions.confirmDeleteUserHint}
              </label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={isLoading}
                id="confirmText"
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                type="text"
                value={confirmText}
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex justify-start gap-3">
          <AlertDialogCancel disabled={isLoading}>
            {fa.admin.users.actions.cancel}
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive/90"
            disabled={!isConfirmValid || isLoading}
            onClick={onConfirm}
          >
            {isLoading
              ? fa.admin.users.actions.deleting
              : fa.admin.users.actions.deleteUser}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
