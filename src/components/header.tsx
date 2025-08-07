import { NavLink, useLocation } from "react-router-dom";

import { Status } from "@/components/status";
import { ThemeToggle } from "@/components/ui";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { Separator } from "./ui/separator";

export function Header({
  SideBarTrigger,
}: {
  SideBarTrigger: React.ReactNode;
}) {
  // Get the current route using React Router's useLocation hook
  const location = useLocation();

  return (
    <header className="bg-background sticky top-0 z-10 flex h-14 items-center justify-between border-b p-4">
      <div className="flex items-center gap-2">
        {location.pathname !== "/" && SideBarTrigger}

        <Separator orientation="vertical" className="bg-border me-2 h-4" />

        <NavLink to="/">
          <h1 className="text-primary text-2xl font-semibold">
            {PERSIAN_TEXTS.navigation.appTitle}
          </h1>
        </NavLink>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <Status />
      </div>
    </header>
  );
}
