import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { fa } from "@/lib/persian-texts";
import type { UserWithoutSensitiveData as User } from "@/server/repositories/admin";

type UserType = Omit<User, "password">;

type ChangeRoleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserType | null;
  onRoleChange: (newRole: "admin" | "user") => void;
  isLoading: boolean;
};

export function ChangeRoleDialog({
  open,
  onOpenChange,
  user,
  onRoleChange,
  isLoading,
}: ChangeRoleDialogProps) {
  if (!user) {
    return null;
  }

  const newRole = user.role === "admin" ? "user" : "admin";

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {fa.admin.users.actions.confirmRoleChange}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {fa.admin.users.actions.confirmRoleChangeMessage}
            <br />
            <br />
            <strong>کاربر:</strong> {user.username}
            <br />
            <strong>نقش فعلی:</strong>{" "}
            <Badge variant={user.role === "admin" ? "default" : "secondary"}>
              {user.role === "admin"
                ? fa.admin.users.table.admin
                : fa.admin.users.table.user}
            </Badge>
            <br />
            <strong>نقش جدید:</strong>{" "}
            <Badge variant={newRole === "admin" ? "default" : "secondary"}>
              {newRole === "admin"
                ? fa.admin.users.table.admin
                : fa.admin.users.table.user}
            </Badge>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {fa.admin.users.actions.cancel}
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isLoading}
            onClick={() => onRoleChange(newRole)}
          >
            {isLoading ? "در حال تغییر..." : fa.admin.users.actions.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
