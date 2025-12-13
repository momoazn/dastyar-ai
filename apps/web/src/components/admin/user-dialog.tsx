import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  paginationParams?: {
    page: number;
    pageSize: number;
    search?: string;
    role?: "admin" | "user";
  };
};

type PasswordFieldProps = {
  label: string;
  placeholder: string;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
};

function PasswordField({
  label,
  placeholder,
  id,
  value,
  onChange,
  disabled = false,
}: PasswordFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-right" htmlFor={id}>
        {label}
      </Label>
      <Input
        autoComplete="new-password"
        className="text-right"
        dir="rtl"
        disabled={disabled}
        id={id}
        onChange={onChange}
        placeholder={placeholder}
        type="password"
        value={value}
      />
    </div>
  );
}

export function UserDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
  paginationParams,
}: UserDialogProps) {
  const isEditMode = !!user;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [changePassword, setChangePassword] = useState(false);
  const queryClient = useQueryClient();

  const resetForm = () => {
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setRole("user");
    setChangePassword(false);
  };

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setRole(user.role);
      setPassword("");
      setConfirmPassword("");
      setChangePassword(false);
    } else {
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      setRole("user");
      setChangePassword(false);
    }
  }, [user]);

  const invalidateUserList = () => {
    if (paginationParams) {
      const input = {
        page: paginationParams.page,
        pageSize: paginationParams.pageSize,
        ...(paginationParams.search && { search: paginationParams.search }),
        ...(paginationParams.role && { role: paginationParams.role }),
      };
      queryClient.invalidateQueries({
        queryKey: orpc.admin.listUsers.queryKey({ input }),
      });
    } else {
      // Fallback: invalidate all listUsers queries if pagination params not provided
      const baseQueryKey = orpc.admin.listUsers.queryKey({
        input: { page: 1, pageSize: 10 },
      });
      queryClient.invalidateQueries({
        queryKey: baseQueryKey.slice(0, 2),
        exact: false,
      });
    }
  };

  const handleMutationSuccess = (message: string, callback?: () => void) => {
    invalidateUserList();
    toast.success(message);
    resetForm();
    onOpenChange(false);
    callback?.();
  };

  const createUserMutation = useMutation(
    orpc.admin.createUser.mutationOptions({
      onSuccess: () => {
        handleMutationSuccess(fa.admin.users.messages.userCreated);
      },
      onError: (error) => {
        toast.error(
          getErrorMessage(error, fa.admin.users.messages.errorCreatingUser)
        );
      },
    })
  );

  const updateUserMutation = useMutation(
    orpc.admin.updateUser.mutationOptions({
      onSuccess: () => {
        handleMutationSuccess(fa.admin.users.messages.userUpdated, onSuccess);
      },
      onError: (error) => {
        toast.error(
          getErrorMessage(error, fa.admin.users.messages.errorUpdatingUser)
        );
      },
    })
  );

  const validatePassword = (pwd: string): boolean => {
    if (pwd.length < 6) {
      toast.error(fa.admin.users.messages.passwordMinLength);
      return false;
    }
    return true;
  };

  const handleAddUser = () => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      toast.error(fa.admin.users.messages.usernameRequired);
      return;
    }
    if (!password.trim()) {
      toast.error(fa.admin.users.messages.passwordRequired);
      return;
    }
    if (!validatePassword(password)) {
      return;
    }

    createUserMutation.mutate({
      username: trimmedUsername,
      password,
      role,
    });
  };

  const handleEditUser = () => {
    if (!user) {
      return;
    }

    const roleChanged = role !== user.role;
    const passwordChanged = changePassword && password.trim().length > 0;
    const hasChanges = roleChanged || passwordChanged;
    if (!hasChanges) {
      onOpenChange(false);
      return;
    }

    if (passwordChanged) {
      if (!validatePassword(password)) {
        return;
      }
      if (password !== confirmPassword) {
        toast.error(fa.admin.users.actions.passwordMismatch);
        return;
      }
    }

    updateUserMutation.mutate({
      userId: user.id,
      ...(roleChanged && { role }),
      ...(passwordChanged && { password }),
    });
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
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const isPending =
    createUserMutation.isPending || updateUserMutation.isPending;

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="space-y-3 text-right">
          <DialogTitle className="text-right">
            {isEditMode
              ? fa.admin.users.actions.editUser
              : fa.admin.users.addDialog.title}
          </DialogTitle>
          <DialogDescription className="text-right text-sm">
            {isEditMode
              ? fa.admin.users.actions.editUserDescription(user?.username ?? "")
              : fa.admin.users.addDialog.description}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6" dir="rtl" onSubmit={handleSubmit}>
          {/* Username */}
          <div className="space-y-2">
            <Label className="text-right" htmlFor="username">
              {fa.admin.users.addDialog.username}
            </Label>
            <Input
              autoComplete="username"
              className="text-right"
              dir="rtl"
              disabled={isPending || isEditMode}
              id="username"
              onChange={(e) => setUsername(e.target.value)}
              placeholder={fa.admin.users.addDialog.usernamePlaceholder}
              value={username}
            />
          </div>

          {/* Password - required for add, optional for edit */}
          {isEditMode ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 p-3 transition-colors hover:bg-muted/50">
                <Checkbox
                  checked={changePassword}
                  id="changePassword"
                  onCheckedChange={(checked) => {
                    const isChecked = checked === true;
                    setChangePassword(isChecked);
                    if (!isChecked) {
                      setPassword("");
                      setConfirmPassword("");
                    }
                  }}
                />
                <Label
                  className="cursor-pointer text-right font-normal"
                  htmlFor="changePassword"
                >
                  {fa.admin.users.actions.resetPassword}
                </Label>
              </div>
              {changePassword && (
                <div className="space-y-4 rounded-md border border-border bg-muted/20 p-4 transition-all">
                  <PasswordField
                    disabled={isPending}
                    id="password"
                    label={fa.admin.users.actions.newPassword}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={fa.admin.users.actions.newPasswordPlaceholder}
                    value={password}
                  />
                  <PasswordField
                    disabled={isPending}
                    id="confirmPassword"
                    label={fa.admin.users.actions.confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={
                      fa.admin.users.actions.confirmPasswordPlaceholder
                    }
                    value={confirmPassword}
                  />
                </div>
              )}
            </div>
          ) : (
            <PasswordField
              disabled={isPending}
              id="password"
              label={fa.admin.users.addDialog.password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={fa.admin.users.addDialog.passwordPlaceholder}
              value={password}
            />
          )}

          {/* Role */}
          <div className="space-y-2">
            <Label className="text-right" htmlFor="role">
              {fa.admin.users.addDialog.role}
            </Label>
            <Select
              disabled={isPending}
              onValueChange={(value) => setRole(value as "admin" | "user")}
              value={role}
            >
              <SelectTrigger className="w-full text-right" dir="rtl" id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="text-right" dir="rtl">
                <SelectItem className="text-right" value="user">
                  {fa.admin.users.table.user}
                </SelectItem>
                <SelectItem className="text-right" value="admin">
                  {fa.admin.users.table.admin}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Buttons */}
          <div className="flex flex-row-reverse gap-3 border-border border-t pt-6">
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
            <Button
              disabled={isPending}
              onClick={() => handleOpenChange(false)}
              type="button"
              variant="outline"
            >
              {fa.admin.users.addDialog.cancel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
