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
import type { UserWithoutSensitiveData as User } from "@/server/repositories/admin";

type UserType = Omit<User, "password" | "salt">;

type DeleteUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserType | null;
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

  const isConfirmValid = confirmText === "DELETE" || confirmText === "حذف";

  if (!user) {
    return null;
  }

  return (
    <AlertDialog onOpenChange={handleOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>حذف کاربر</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3">
            <p>
              آیا مطمئن هستید که می‌خواهید کاربر <strong>{user.username}</strong>{" "}
              را حذف کنید؟
            </p>
            <p className="text-muted-foreground text-sm">
              این عمل قابل بازگشت نیست و تمام داده‌های کاربر (پیام‌ها، اسناد،
              تصاویر و غیره) حذف خواهد شد.
            </p>
            <div className="space-y-2">
              <label className="font-medium text-sm" htmlFor="confirmText">
                برای تایید، عبارت{" "}
                <code className="bg-muted px-2 py-1">DELETE</code> یا{" "}
                <code className="bg-muted px-2 py-1">حذف</code> را وارد کنید:
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
        <div className="flex justify-end gap-3">
          <AlertDialogCancel disabled={isLoading}>لغو</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive/90"
            disabled={!isConfirmValid || isLoading}
            onClick={onConfirm}
          >
            {isLoading ? "در حال حذف..." : "حذف کاربر"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
