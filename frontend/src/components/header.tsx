import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { NavLink } from "react-router-dom";

import { Status } from "@/components/status";
import { Button, ThemeToggle } from "@/components/ui";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { Navigation } from "./navigation";

interface HeaderProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export function Header({ isSidebarOpen, toggleSidebar }: HeaderProps) {
  return (
    <header className="w-full border-b">
      <div className="flex h-16 items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <ChevronsLeft className="h-4 w-4" />
            )}
          </Button>
          <NavLink to="/">
            <h1 className="text-2xl font-semibold text-primary">
              {PERSIAN_TEXTS.navigation.appTitle}
            </h1>
          </NavLink>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Status />
        </div>
      </div>

      <nav className="flex items-center justify-start border-t">
        <Navigation />
      </nav>
    </header>
  );
}
