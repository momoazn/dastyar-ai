import { useLocation } from '@tanstack/react-router';
import { ThemeToggle } from '@/components/theme-toggle';

export function Header({
  SideBarTrigger,
}: {
  SideBarTrigger: React.ReactNode;
}) {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between p-4">
      <div className="flex items-center gap-2">
        {location.pathname !== '/' && SideBarTrigger}
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
      </div>
    </header>
  );
}
