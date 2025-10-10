import { Link } from '@tanstack/react-router';
import { useSidebar } from '@/components/ui';
import { cn } from '@/lib/utils';
import { navMain, useActiveNavItem } from '../nav';

export interface NavigationMenuProps {
  variant?: 'icon' | 'full';
  className?: string;
}

export function NavigationMenu({
  variant = 'full',
  className,
}: NavigationMenuProps) {
  const { setOpen } = useSidebar();
  const activeItem = useActiveNavItem();

  if (variant === 'icon') {
    return (
      <div className={className}>
        {navMain.map((item) => (
          <Link
            className="flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            key={item.title}
            onClick={() => setOpen(true)}
            to={item.url}
          >
            <item.icon className="size-5" />
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      {navMain.map((item) => (
        <Link
          className={cn(
            'flex h-9 items-center gap-2 rounded-md px-2.5 font-medium text-sm transition-all duration-200 hover:scale-[1.01] hover:shadow-sm',
            activeItem?.url === item.url
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          )}
          key={item.title}
          onClick={() => setOpen(true)}
          to={item.url}
        >
          <item.icon className="size-4" />
          <span>{item.title}</span>
        </Link>
      ))}
    </div>
  );
}
