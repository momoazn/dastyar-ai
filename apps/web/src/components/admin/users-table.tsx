import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreHorizontal,
  Search,
  Settings,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getErrorMessage } from "@/lib/error-utils";
import { fa } from "@/lib/persian-texts";
import type { UserWithoutSensitiveData as User } from "@/server/repositories/admin";
import { orpc } from "@/utils/orpc";
import { ChangeRoleDialog } from "./change-role-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";
import { ResetPasswordDialog } from "./reset-password-dialog";
import { AdminTableShell } from "./table-shell";
import { UserDetailDialog } from "./user-detail-dialog";

type UserType = Omit<User, "password">;

export function UsersTable() {
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [changeRoleDialogOpen, setChangeRoleDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [userDetailDialogOpen, setUserDetailDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"admin" | "user" | undefined>();
  const queryClient = useQueryClient();

  const {
    data: usersResponse,
    isLoading,
    error,
  } = useQuery(
    orpc.admin.listUsersWithPagination.queryOptions({
      input: {
        page,
        pageSize,
        search: searchQuery || undefined,
        role: roleFilter,
      },
    })
  );

  const users = usersResponse?.users ?? [];
  const isEmpty = !(isLoading || error) && users.length === 0;

  const updateRoleMutation = useMutation(
    orpc.admin.updateUserRole.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.admin.listUsersWithPagination.queryKey({
            input: {
              page,
              pageSize,
              search: searchQuery || undefined,
              role: roleFilter,
            },
          }),
        });
        toast.success(fa.admin.users.messages.roleUpdated);
        setChangeRoleDialogOpen(false);
      },
      onError: () => {
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
      onError: () => {
        toast.error(fa.admin.users.messages.errorUpdatingPassword);
      },
    })
  );

  const deleteUserMutation = useMutation(
    orpc.admin.deleteUser.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.admin.listUsersWithPagination.queryKey({
            input: {
              page,
              pageSize,
              search: searchQuery || undefined,
              role: roleFilter,
            },
          }),
        });
        toast.success(fa.admin.users.messages.userDeleted);
        setDeleteUserDialogOpen(false);
      },
      onError: (deleteError) => {
        const errorMessage = getErrorMessage(
          deleteError,
          fa.admin.users.messages.errorDeletingUser
        );
        toast.error(errorMessage);
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

  const handleShowDetails = (user: UserType) => {
    setSelectedUser(user);
    setUserDetailDialogOpen(true);
  };

  const handleDeleteUser = (user: UserType) => {
    setSelectedUser(user);
    setDeleteUserDialogOpen(true);
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

  const handleConfirmDeleteUser = () => {
    if (!selectedUser) {
      return;
    }
    deleteUserMutation.mutate({
      userId: selectedUser.id,
    });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(Number.parseInt(newSize, 10));
    setPage(1);
  };

  const totalPages = usersResponse?.totalPages ?? 1;

  return (
    <>
      <AdminTableShell
        actions={null}
        badge={
          <Badge variant="secondary">
            {fa.admin.users.userCount(usersResponse?.total ?? 0)}
          </Badge>
        }
        emptyMessage={fa.admin.users.notFound}
        errorMessage={fa.admin.users.errorLoading}
        filters={
          <>
            <div className="flex-1">
              <div className="relative">
                <Search className="-translate-y-1/2 absolute top-1/2 right-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pr-10"
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder={fa.admin.users.searchPlaceholder}
                  value={searchQuery}
                />
              </div>
            </div>
            <Select
              onValueChange={(value) => {
                setRoleFilter(
                  value === "all" ? undefined : (value as "admin" | "user")
                );
                setPage(1);
              }}
              value={roleFilter ?? "all"}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder={fa.admin.users.filterByRole} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{fa.admin.users.filterAll}</SelectItem>
                <SelectItem value="admin">
                  {fa.admin.users.filterAdmins}
                </SelectItem>
                <SelectItem value="user">
                  {fa.admin.users.filterRegularUsers}
                </SelectItem>
              </SelectContent>
            </Select>
          </>
        }
        footer={
          <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span className="text-muted-foreground text-sm">
                {fa.admin.users.show}
              </span>
              <Select
                onValueChange={handlePageSizeChange}
                value={pageSize.toString()}
              >
                <SelectTrigger className="w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-muted-foreground text-sm">
                {fa.admin.users.perPage}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">
                {fa.admin.users.pageInfo(page, totalPages)}
              </span>
              <Button
                disabled={page === 1}
                onClick={() => handlePageChange(page - 1)}
                size="icon"
                variant="outline"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
              </Button>
              <Button
                disabled={page === totalPages}
                onClick={() => handlePageChange(page + 1)}
                size="icon"
                variant="outline"
              >
                <ChevronLeft className="h-4 w-4 rotate-180" />
              </Button>
            </div>
          </div>
        }
        isEmpty={isEmpty}
        isError={Boolean(error)}
        isLoading={isLoading}
        loadingMessage={fa.admin.users.loading}
        title={fa.admin.users.title}
      >
        <div className="overflow-x-auto rounded-md border">
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
                            updatePasswordMutation.isPending ||
                            deleteUserMutation.isPending
                          }
                          size="sm"
                          variant="ghost"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" side="left">
                        <DropdownMenuItem
                          disabled={updateRoleMutation.isPending}
                          onClick={() => handleShowDetails(user)}
                        >
                          <Eye className="ml-2 h-4 w-4" />
                          {fa.admin.users.viewDetails}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={updateRoleMutation.isPending}
                          onClick={() => handleChangeRole(user)}
                        >
                          <Settings className="ml-2 h-4 w-4" />
                          {fa.admin.users.actions.changeRole}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={updatePasswordMutation.isPending}
                          onClick={() => handleResetPassword(user)}
                        >
                          <Settings className="ml-2 h-4 w-4" />
                          {fa.admin.users.actions.resetPassword}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          disabled={deleteUserMutation.isPending}
                          onClick={() => handleDeleteUser(user)}
                        >
                          <Trash2 className="ml-2 h-4 w-4" />
                          {fa.admin.users.deleteUser}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell className="text-right">
                    {new Date(user.createdAt).toLocaleDateString("fa-IR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={user.role === "admin" ? "default" : "secondary"}
                    >
                      {user.role === "admin"
                        ? fa.admin.users.table.admin
                        : fa.admin.users.table.user}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{user.username}</TableCell>
                  <TableCell className="text-right font-medium">
                    {user.id}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </AdminTableShell>

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

      <DeleteUserDialog
        isLoading={deleteUserMutation.isPending}
        onConfirm={handleConfirmDeleteUser}
        onOpenChange={setDeleteUserDialogOpen}
        open={deleteUserDialogOpen}
        user={selectedUser}
      />

      <UserDetailDialog
        onOpenChange={setUserDetailDialogOpen}
        open={userDetailDialogOpen}
        user={selectedUser}
      />
    </>
  );
}
