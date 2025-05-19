import { NavLink } from "react-router-dom";

import { Status } from "@/components/status";
import { ThemeToggle } from "@/components/ui";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { Separator } from "./ui/separator";

export function Header({
  SideBarTrigger,
}: {
  SideBarTrigger: React.ReactNode;
}) {
  return (
    <header className="flex h-14 items-center justify-between border-b p-4">
      <div className="flex items-center gap-2">
        {SideBarTrigger}

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
