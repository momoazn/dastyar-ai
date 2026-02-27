import { Link } from "@tanstack/react-router";
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui";
import { fa } from "@/lib/texts";

export type SidebarHeaderProps = {
  variant?: "icon" | "full";
  className?: string;
};

export function AppSidebarHeader({
  variant = "full",
  className,
}: SidebarHeaderProps) {
  if (variant === "icon") {
    return (
      <SidebarHeader className={className}>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="md:h-8 md:p-0" size="lg">
              <Link aria-label={fa.navigation.appTitle} to="/">
                <img
                  alt={fa.navigation.appTitle}
                  className="size-8 rounded-lg"
                  height={32}
                  src="/brand-logo.svg"
                  width={32}
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
    );
  }

  return (
    <SidebarHeader
      className={`flex h-16 flex-row items-center bg-sidebar backdrop-blur-md ${className}`}
    >
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            className="h-10 hover:bg-sidebar-accent/50 data-[state=open]:bg-sidebar-accent/50"
            size="default"
          >
            <Link to="/">
              <div className="flex items-center gap-2">
                <img
                  alt={fa.navigation.appTitle}
                  className="size-7 rounded-lg"
                  height={28}
                  src="/brand-logo.svg"
                  width={28}
                />
                <h1 className="font-medium text-gray-900 text-lg dark:text-gray-100">
                  {fa.navigation.appTitle}
                </h1>
              </div>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
}
