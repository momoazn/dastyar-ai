import { ChevronsLeft, ChevronsRight } from "lucide-react";

import { Status } from "@/components/status";
import { Button, ThemeToggle } from "@/components/ui";

interface HeaderProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export function Header({ isSidebarOpen, toggleSidebar }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b p-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          {isSidebarOpen ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <ChevronsLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <Status />
      </div>
    </header>
  );
}
