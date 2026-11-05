import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/theme-toggle";
import { fa } from "@/lib/texts";
import { cn } from "@/lib/utils";

export function Header({
  SideBarTrigger,
  actions,
  className,
}: {
  SideBarTrigger?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  const hasSidebar = Boolean(SideBarTrigger);

  return (
    <header
      className={cn(
        "sticky top-0 z-10 flex h-14 items-center justify-between gap-2 bg-sidebar px-2 md:h-16 md:px-4",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {SideBarTrigger}
        {/* The sidebar shows the brand on desktop; show it here when the sidebar is hidden. */}
        <Link
          className={`flex min-w-0 items-center gap-2 rounded-md font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${hasSidebar ? "md:hidden" : ""}`}
          to="/"
        >
          <img
            alt=""
            className="size-7 shrink-0 rounded-lg"
            height={28}
            src="/brand-logo.svg"
            width={28}
          />
          <span className="truncate">{fa.navigation.appTitle}</span>
        </Link>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {actions}
        <ThemeToggle />
      </div>
    </header>
  );
}
