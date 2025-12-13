import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
import { orpc } from "@/utils/orpc";

type AddUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddUserDialog({ open, onOpenChange }: AddUserDialogProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const queryClient = useQueryClient();

  const createUserMutation = useMutation(
    orpc.admin.createUser.mutationOptions({
      onSuccess: () => {
        const queryKey = orpc.admin.listUsersWithPagination
          .queryKey({
            input: { page: 1, pageSize: 10 },
          })
          .slice(0, 2);
        queryClient.invalidateQueries({
          queryKey,
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

  const handleReset = () => {
    setUsername("");
    setPassword("");
    setRole("user");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleReset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-right">
          <DialogTitle>{fa.admin.users.addDialog.title}</DialogTitle>
          <DialogDescription>
            {fa.admin.users.addDialog.description}
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
              disabled={createUserMutation.isPending}
              id="username"
              onChange={(e) => setUsername(e.target.value)}
              placeholder={fa.admin.users.addDialog.usernamePlaceholder}
              value={username}
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">
              {fa.admin.users.addDialog.password}
            </Label>
            <Input
              autoComplete="new-password"
              disabled={createUserMutation.isPending}
              id="password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder={fa.admin.users.addDialog.passwordPlaceholder}
              type="password"
              value={password}
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">{fa.admin.users.addDialog.role}</Label>
            <Select
              disabled={createUserMutation.isPending}
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
              disabled={createUserMutation.isPending}
              onClick={() => handleOpenChange(false)}
              type="button"
              variant="outline"
            >
              {fa.admin.users.addDialog.cancel}
            </Button>
            <Button disabled={createUserMutation.isPending} type="submit">
              {createUserMutation.isPending
                ? fa.admin.users.addDialog.creating
                : fa.admin.users.addDialog.create}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
