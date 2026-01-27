import { Link } from "@tanstack/react-router";
import { Command } from "lucide-react";
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
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
    );
  }

  return (
    <SidebarHeader
      className={`flex h-14 flex-row items-center bg-sidebar backdrop-blur-md ${className}`}
    >
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            className="h-10 hover:bg-sidebar-accent/50"
            size="default"
          >
            <Link to="/">
              <h1 className="bg-gradient-to-l from-primary to-primary/70 bg-clip-text font-bold text-lg text-transparent tracking-tight">
                {fa.navigation.appTitle}
              </h1>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
}
