import { Link, useLocation } from '@tanstack/react-router';
import { navMain, useActiveNavItem } from '@/components/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button, Separator } from '@/components/ui';
import { fa } from '@/lib/persian-texts';

export function Header({
  SideBarTrigger,
}: {
  SideBarTrigger: React.ReactNode;
}) {
  const location = useLocation();
  const activeItem = useActiveNavItem();

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-secondary p-4">
      <div className="flex items-center gap-2">
        {location.pathname !== '/' && SideBarTrigger}

        <Separator className="me-2 h-4 bg-border" orientation="vertical" />

        <Link to="/">
          <h1 className="font-semibold text-2xl text-primary">
            {fa.navigation.appTitle}
          </h1>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          {navMain
            .filter((item) => item.url !== '/')
            .map((item) => (
              <Button
                aria-pressed={activeItem?.url === item.url}
                asChild
                key={item.url}
                title={item.title}
                variant={activeItem?.url === item.url ? 'secondary' : 'ghost'}
              >
                <Link to={item.url}>
                  <item.icon className="size-4" />
                  <span>{item.title}</span>
                </Link>
              </Button>
            ))}
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
