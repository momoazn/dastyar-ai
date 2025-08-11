import { Link, useLocation } from '@tanstack/react-router';
import { Status } from '@/components/status';
import { ThemeToggle } from '@/components/theme-toggle';
import { Separator } from '@/components/ui';
import { PERSIAN_TEXTS } from '@/lib/persian-texts';

export function Header({
  SideBarTrigger,
}: {
  SideBarTrigger: React.ReactNode;
}) {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background p-4">
      <div className="flex items-center gap-2">
        {location.pathname !== '/' && SideBarTrigger}

        <Separator className="me-2 h-4 bg-border" orientation="vertical" />

        <Link to="/">
          <h1 className="font-semibold text-2xl text-primary">
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
