import { Status } from "@/components/status";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { Link } from "@tanstack/react-router";

export function Header({
  SideBarTrigger,
}: {
  SideBarTrigger: React.ReactNode;
}) {
  return (
    <header className="bg-background sticky top-0 z-10 flex h-14 items-center justify-between border-b p-4">
      <div className="flex items-center gap-2">
        {SideBarTrigger}

        <Separator orientation="vertical" className="bg-border me-2 h-4" />

        <Link to="/">
          <h1 className="text-primary text-2xl font-semibold">
            {PERSIAN_TEXTS.navigation.appTitle}
          </h1>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <Status />
      </div>
    </header>
  );
}
