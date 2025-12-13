import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getErrorMessage } from "@/lib/error-utils";
import { fa } from "@/lib/persian-texts";
import type { User } from "@/types/database";
import { orpc } from "@/utils/orpc";

type UserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  onSuccess?: () => void;
};

export function UserDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: UserDialogProps) {
  const isEditMode = Boolean(user);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [changePassword, setChangePassword] = useState(false);
  const queryClient = useQueryClient();

  const handleReset = useCallback(() => {
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setRole("user");
    setChangePassword(false);
  }, []);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setRole(user.role);
      setPassword("");
      setConfirmPassword("");
      setChangePassword(false);
    } else {
      handleReset();
    }
  }, [user, handleReset]);

  const createUserMutation = useMutation(
    orpc.admin.createUser.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.admin.listUsers
            .queryKey({
              input: { page: 1, pageSize: 10 },
            })
            .slice(0, 2),
          exact: false,
        });
        toast.success(fa.admin.users.messages.userCreated);
        handleReset();
        onOpenChange(false);
      },
      onError: (error) => {
        const errorMessage = getErrorMessage(
          error,
          fa.admin.users.messages.errorCreatingUser
        );
        toast.error(errorMessage);
      },
    })
  );

  const updateUserMutation = useMutation(
    orpc.admin.updateUser.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.admin.listUsers
            .queryKey({
              input: { page: 1, pageSize: 10 },
            })
            .slice(0, 2),
          exact: false,
        });
        toast.success(fa.admin.users.messages.userUpdated);
        handleReset();
        onOpenChange(false);
        onSuccess?.();
      },
      onError: (error) => {
        const errorMessage = getErrorMessage(
          error,
          fa.admin.users.messages.errorUpdatingUser
        );
        toast.error(errorMessage);
      },
    })
  );

  const handleAddUser = () => {
    if (!username.trim()) {
      toast.error(fa.admin.users.messages.usernameRequired);
      return;
    }

    if (!password.trim()) {
      toast.error(fa.admin.users.messages.passwordRequired);
      return;
    }

    if (password.length < 6) {
      toast.error(fa.admin.users.messages.passwordMinLength);
      return;
    }

    createUserMutation.mutate({
      username: username.trim(),
      password,
      role,
    });
  };

  const handleEditUser = () => {
    if (!user) {
      return;
    }

    const roleChanged = role !== user.role;
    const passwordChanged = changePassword && password.trim() !== "";
    const hasChanges = roleChanged || passwordChanged;

    if (!hasChanges) {
      onOpenChange(false);
      return;
    }

    if (passwordChanged) {
      if (password.length < 6) {
        toast.error(fa.admin.users.messages.passwordMinLength);
        return;
      }

      if (password !== confirmPassword) {
        toast.error(fa.admin.users.actions.passwordMismatch);
        return;
      }
    }

    const updates: {
      userId: number;
      role?: "admin" | "user";
      password?: string;
    } = {
      userId: user.id,
    };

    if (roleChanged) {
      updates.role = role;
    }

    if (passwordChanged) {
      updates.password = password;
    }

    updateUserMutation.mutate(updates);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditMode) {
      handleEditUser();
    } else {
      handleAddUser();
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleReset();
    }
    onOpenChange(newOpen);
  };

  const isPending =
    createUserMutation.isPending || updateUserMutation.isPending;

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-right">
          <DialogTitle>
            {isEditMode
              ? fa.admin.users.actions.editUser
              : fa.admin.users.addDialog.title}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? fa.admin.users.actions.editUserDescription(user?.username ?? "")
              : fa.admin.users.addDialog.description}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">
              {fa.admin.users.addDialog.username}
            </Label>
            <Input
              autoComplete="username"
              disabled={isPending || isEditMode}
              id="username"
              onChange={(e) => setUsername(e.target.value)}
              placeholder={fa.admin.users.addDialog.usernamePlaceholder}
              value={username}
            />
          </div>

          {/* Password - required for add, optional for edit */}
          {isEditMode ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    checked={changePassword}
                    className="h-4 w-4"
                    id="changePassword"
                    onChange={(e) => {
                      setChangePassword(e.target.checked);
                      if (!e.target.checked) {
                        setPassword("");
                        setConfirmPassword("");
                      }
                    }}
                    type="checkbox"
                  />
                  <Label htmlFor="changePassword">
                    {fa.admin.users.actions.resetPassword}
                  </Label>
                </div>
              </div>
              {changePassword && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      {fa.admin.users.actions.newPassword}
                    </Label>
                    <Input
                      autoComplete="new-password"
                      disabled={isPending}
                      id="password"
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={
                        fa.admin.users.actions.newPasswordPlaceholder
                      }
                      type="password"
                      value={password}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      {fa.admin.users.actions.confirmPassword}
                    </Label>
                    <Input
                      autoComplete="new-password"
                      disabled={isPending}
                      id="confirmPassword"
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={
                        fa.admin.users.actions.confirmPasswordPlaceholder
                      }
                      type="password"
                      value={confirmPassword}
                    />
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="password">
                {fa.admin.users.addDialog.password}
              </Label>
              <Input
                autoComplete="new-password"
                disabled={isPending}
                id="password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder={fa.admin.users.addDialog.passwordPlaceholder}
                type="password"
                value={password}
              />
            </div>
          )}

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">{fa.admin.users.addDialog.role}</Label>
            <Select
              disabled={isPending}
              onValueChange={(value) => setRole(value as "admin" | "user")}
              value={role}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">
                  {fa.admin.users.table.user}
                </SelectItem>
                <SelectItem value="admin">
                  {fa.admin.users.table.admin}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Buttons */}
          <div className="flex justify-start gap-3 pt-4">
            <Button
              disabled={isPending}
              onClick={() => handleOpenChange(false)}
              type="button"
              variant="outline"
            >
              {fa.admin.users.addDialog.cancel}
            </Button>
            <Button disabled={isPending} type="submit">
              {(() => {
                if (isPending) {
                  return isEditMode
                    ? fa.admin.users.actions.saving
                    : fa.admin.users.addDialog.creating;
                }
                return isEditMode
                  ? fa.admin.users.actions.save
                  : fa.admin.users.addDialog.create;
              })()}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
