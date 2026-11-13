import { Link } from "@tanstack/react-router";
import { useSidebar } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useActiveNavItem } from "../nav";
import { useEnabledNavItems } from "../use-enabled-nav-items";

export type NavigationMenuProps = {
  variant?: "icon" | "full";
  className?: string;
};

export function NavigationMenu({
  variant = "full",
  className,
}: NavigationMenuProps) {
  const { setOpen, setOpenMobile, isMobile } = useSidebar();
  const navItems = useEnabledNavItems();
  const activeItem = useActiveNavItem(navItems);

  const handleClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    } else {
      setOpen(true);
    }
  };

  if (variant === "icon") {
    return (
      <div className={className}>
        {navItems.map((item) => (
          <Link
            aria-current={activeItem?.url === item.url ? "page" : undefined}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              activeItem?.url === item.url
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
            key={item.title}
            onClick={handleClick}
            to={item.url}
          >
            <item.icon className="size-5" />
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      {navItems.map((item) => (
        <Link
          aria-current={activeItem?.url === item.url ? "page" : undefined}
          className={cn(
            "my-1 flex h-9 items-center gap-2 rounded-md px-2.5 font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            activeItem?.url === item.url
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
          key={item.title}
          onClick={handleClick}
          to={item.url}
        >
          <item.icon className="size-4" />
          <span>{item.title}</span>
        </Link>
      ))}
    </div>
  );
}
