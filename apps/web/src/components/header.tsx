import { useLocation } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header({
  SideBarTrigger,
}: {
  SideBarTrigger: React.ReactNode;
}) {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between bg-sidebar px-4 backdrop-blur-md">
      <div className="flex items-center gap-2">
        {location.pathname !== "/" && SideBarTrigger}
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}
