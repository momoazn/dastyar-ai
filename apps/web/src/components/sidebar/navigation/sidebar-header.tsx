import { Link } from "@tanstack/react-router";
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
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
  const { isMobile, setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  if (variant === "icon") {
    return (
      <SidebarHeader className={className}>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="md:h-8 md:p-0" size="lg">
              <Link
                aria-label={fa.navigation.appTitle}
                onClick={handleLinkClick}
                to="/"
              >
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
            <Link onClick={handleLinkClick} to="/">
              <div className="flex items-center gap-2">
                <img
                  alt={fa.navigation.appTitle}
                  className="size-7 rounded-lg"
                  height={28}
                  src="/brand-logo.svg"
                  width={28}
                />
                <span className="font-semibold text-lg text-sidebar-foreground">
                  {fa.navigation.appTitle}
                </span>
              </div>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
}
