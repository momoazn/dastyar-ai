import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { ChevronsLeft } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import { Status } from "./status";
import { Button } from "./ui/button";
import { ThemeToggle } from "./ui/theme-toggle";

interface HeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: Dispatch<SetStateAction<boolean>>;
}

export function Header({ isSidebarOpen, setIsSidebarOpen }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b p-4">
      <div className="flex items-center gap-2">
        {!isSidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen((c) => !c)}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        )}
        <h1 className="text-2xl font-semibold text-primary">
          {PERSIAN_TEXTS.navigation.appTitle}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <Status />
      </div>
    </header>
  );
}
