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
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useUser } from "@/hooks/use-user";
import { fa } from "@/lib/texts";

export function UserProfileButton() {
  const [token] = useAtom(tokenAtom);
  const [, logout] = useAtom(logoutAtom);
  const { data: user, isLoading } = useUser();
  const navigate = useNavigate();
  const { isMobile, setOpenMobile } = useSidebar();

  const closeMobile = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  if (!token) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          onClick={() => {
            closeMobile();
            navigate({ to: "/login" });
          }}
          size="lg"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <User className="size-4" />
          </div>
          <div className="grid flex-1 text-start text-sm leading-tight">
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
          <div className="grid flex-1 text-start text-sm leading-tight">
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

  const roleLabel =
    user?.role === "admin"
      ? fa.userProfile.roles.admin
      : fa.userProfile.roles.user;

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
                <User aria-hidden="true" className="size-4" />
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-start text-sm leading-tight">
              <span className="truncate font-semibold tabular-nums">
                {user?.username}
              </span>
              <span className="truncate text-muted-foreground text-xs">
                {roleLabel}
              </span>
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
              <p className="font-medium tabular-nums">{user?.username}</p>
              <p className="text-muted-foreground text-xs">{roleLabel}</p>
            </div>
          </div>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => {
              closeMobile();
              navigate({ to: "/settings" });
            }}
          >
            <Settings aria-hidden="true" className="h-4 w-4" />
            <span>{fa.settings.title}</span>
          </DropdownMenuItem>
          {user?.role === "admin" && (
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => {
                closeMobile();
                navigate({ to: "/admin" });
              }}
            >
              <Shield aria-hidden="true" className="h-4 w-4" />
              <span>{fa.admin.title}</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => {
              closeMobile();
              logout();
            }}
          >
            <LogOut aria-hidden="true" className="h-4 w-4" />
            <span>{fa.userProfile.logOut}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
