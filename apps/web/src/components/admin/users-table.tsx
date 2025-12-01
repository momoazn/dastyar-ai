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
import { Card } from "@/components/ui/card";
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
import { fa } from "@/lib/persian-texts";
import type { UserWithoutSensitiveData as User } from "@/server/repositories/admin";
import { orpc } from "@/utils/orpc";
import { ChangeRoleDialog } from "./change-role-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";
import { ResetPasswordDialog } from "./reset-password-dialog";
import { UserDetailDialog } from "./user-detail-dialog";

type UserType = Omit<User, "password" | "salt">;

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
        toast.success("کاربر با موفقیت حذف شد");
        setDeleteUserDialogOpen(false);
      },
      onError: (deleteError) => {
        if (deleteError instanceof Error) {
          toast.error(deleteError.message);
        } else {
          toast.error("خطا در حذف کاربر");
        }
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

  const totalPages = usersResponse?.totalPages ?? 1;

  return (
    <>
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">{fa.admin.users.title}</h3>
            <Badge variant="secondary">{usersResponse?.total ?? 0} کاربر</Badge>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="جستجو بر اساس نام کاربری..."
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
                <SelectValue placeholder="فیلتر بر اساس نقش" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">تمام کاربران</SelectItem>
                <SelectItem value="admin">مدیران</SelectItem>
                <SelectItem value="user">کاربران عادی</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
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
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            disabled={updateRoleMutation.isPending}
                            onClick={() => handleShowDetails(user)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            مشاهده جزئیات
                          </DropdownMenuItem>
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
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            disabled={deleteUserMutation.isPending}
                            onClick={() => handleDeleteUser(user)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            حذف کاربر
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

          {/* Pagination */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">نمایش</span>
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
              <span className="text-muted-foreground text-sm">در هر صفحه</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">
                صفحه {page} از {totalPages}
              </span>
              <Button
                disabled={page === 1}
                onClick={() => handlePageChange(page - 1)}
                size="icon"
                variant="outline"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                disabled={page === totalPages}
                onClick={() => handlePageChange(page + 1)}
                size="icon"
                variant="outline"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
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
