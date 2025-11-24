import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserType | null;
  isLoading: boolean;
  onConfirm: () => void;
}

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
    confirmText === "DELETE" || confirmText === "حذف";

  if (!user) {
    return null;
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
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
            <p className="text-sm text-muted-foreground">
              این عمل قابل بازگشت نیست و تمام داده‌های کاربر (پیام‌ها، اسناد،
              تصاویر و غیره) حذف خواهد شد.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                برای تایید، عبارت <code className="bg-muted px-2 py-1">DELETE</code> یا{" "}
                <code className="bg-muted px-2 py-1">حذف</code> را وارد کنید:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="DELETE"
                disabled={isLoading}
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3 justify-end">
          <AlertDialogCancel disabled={isLoading}>
            لغو
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={!isConfirmValid || isLoading}
            onClick={onConfirm}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isLoading ? "در حال حذف..." : "حذف کاربر"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
