import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Settings } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fa } from "@/lib/persian-texts";
import type { UserWithoutSensitiveData as User } from "@/server/repositories/admin";
import { orpc } from "@/utils/orpc";
import { ChangeRoleDialog } from "./change-role-dialog";
import { ResetPasswordDialog } from "./reset-password-dialog";

type UserType = Omit<User, "password" | "salt">;

export function UsersTable() {
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [changeRoleDialogOpen, setChangeRoleDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: users,
    isLoading,
    error,
  } = useQuery(orpc.admin.listUsers.queryOptions());

  const updateRoleMutation = useMutation(
    orpc.admin.updateUserRole.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.admin.listUsers.queryKey(),
        });
        toast.success(fa.admin.users.messages.roleUpdated);
        setChangeRoleDialogOpen(false);
      },
      onError: (_err) => {
        toast.error(fa.admin.users.messages.errorUpdatingRole);
      },
    })
  );

  const updatePasswordMutation = useMutation(
    orpc.admin.updateUserPassword.mutationOptions({
      onSuccess: () => {
        toast.success(fa.admin.users.messages.passwordUpdated);
        setResetPasswordDialogOpen(false);
      },
      onError: (_err) => {
        toast.error(fa.admin.users.messages.errorUpdatingPassword);
      },
    })
  );

  const handleChangeRole = (user: UserType) => {
    setSelectedUser(user);
    setChangeRoleDialogOpen(true);
  };

  const handleResetPassword = (user: UserType) => {
    setSelectedUser(user);
    setResetPasswordDialogOpen(true);
  };

  const handleRoleChange = (newRole: "admin" | "user") => {
    if (!selectedUser) {
      return;
    }
    updateRoleMutation.mutate({
      userId: selectedUser.id,
      newRole,
    });
  };

  const handlePasswordReset = (newPassword: string) => {
    if (!selectedUser) {
      return;
    }
    updatePasswordMutation.mutate({
      userId: selectedUser.id,
      newPassword,
    });
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
          <p className="text-muted-foreground">در حال بارگذاری کاربران...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-destructive">
          <p>خطا در بارگذاری کاربران</p>
        </div>
      </Card>
    );
  }

  if (!users || users.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <p>هیچ کاربری یافت نشد</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">{fa.admin.users.title}</h3>
            <Badge variant="secondary">{users.length} کاربر</Badge>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">
                    {fa.admin.users.table.actions}
                  </TableHead>
                  <TableHead className="text-right">
                    {fa.admin.users.table.createdAt}
                  </TableHead>
                  <TableHead className="text-right">
                    {fa.admin.users.table.role}
                  </TableHead>
                  <TableHead className="text-right">
                    {fa.admin.users.table.username}
                  </TableHead>
                  <TableHead className="text-right">
                    {fa.admin.users.table.id}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            disabled={
                              updateRoleMutation.isPending ||
                              updatePasswordMutation.isPending
                            }
                            size="sm"
                            variant="ghost"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            disabled={updateRoleMutation.isPending}
                            onClick={() => handleChangeRole(user)}
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            {fa.admin.users.actions.changeRole}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={updatePasswordMutation.isPending}
                            onClick={() => handleResetPassword(user)}
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            {fa.admin.users.actions.resetPassword}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell className="text-right">
                      {new Date(user.createdAt).toLocaleDateString("fa-IR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          user.role === "admin" ? "default" : "secondary"
                        }
                      >
                        {user.role === "admin"
                          ? fa.admin.users.table.admin
                          : fa.admin.users.table.user}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {user.username}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {user.id}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>

      <ChangeRoleDialog
        isLoading={updateRoleMutation.isPending}
        onOpenChange={setChangeRoleDialogOpen}
        onRoleChange={handleRoleChange}
        open={changeRoleDialogOpen}
        user={selectedUser}
      />

      <ResetPasswordDialog
        isLoading={updatePasswordMutation.isPending}
        onOpenChange={setResetPasswordDialogOpen}
        onPasswordReset={handlePasswordReset}
        open={resetPasswordDialogOpen}
        user={selectedUser}
      />
    </>
  );
}
