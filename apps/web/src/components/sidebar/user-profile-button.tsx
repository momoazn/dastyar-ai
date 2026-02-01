import { useNavigate } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { LogOut, Settings, Shield, User } from "lucide-react";
import { logoutAtom, tokenAtom } from "@/atoms/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useUser } from "@/hooks/use-user";
import { fa } from "@/lib/texts";

export function UserProfileButton() {
  const [token] = useAtom(tokenAtom);
  const [, logout] = useAtom(logoutAtom);
  const { data: user, isLoading } = useUser();
  const navigate = useNavigate();

  if (!token) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          onClick={() => navigate({ to: "/login" })}
          size="lg"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <User className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">
              {fa.userProfile.notLoggedIn}
            </span>
            <span className="truncate text-xs">
              {fa.userProfile.clickToLogin}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  if (isLoading) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          className="cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          size="lg"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <User className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">
              {fa.userProfile.loading}
            </span>
            <span className="truncate text-xs">
              {fa.userProfile.pleaseWait}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  const userInitials = user?.username
    ? user.username
        .split(" ")
        .map((name: string) => name[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <SidebarMenuItem className="cursor-pointer">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            className="cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            size="lg"
          >
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{user?.username}</span>
              <span className="truncate text-xs">{user?.role}</span>
            </div>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          side="bottom"
          sideOffset={4}
        >
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-1 leading-none">
              <p className="font-medium">{user?.username}</p>
              <p className="text-muted-foreground text-xs">{user?.role}</p>
            </div>
          </div>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => navigate({ to: "/settings" })}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>{fa.settings.title}</span>
          </DropdownMenuItem>
          {user?.role === "admin" && (
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => navigate({ to: "/admin" })}
            >
              <Shield className="mr-2 h-4 w-4" />
              <span>{fa.admin.title}</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>{fa.userProfile.logOut}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
