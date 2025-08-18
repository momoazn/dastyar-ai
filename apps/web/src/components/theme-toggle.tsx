import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui';
import { fa } from '@/lib/persian-texts';

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const effective = theme === 'system' ? resolvedTheme : theme;

  return (
    <Button
      aria-label={fa.ui.themeToggle}
      onClick={() => setTheme(effective === 'light' ? 'dark' : 'light')}
      size="icon"
      variant="ghost"
    >
      {effective === 'light' ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  );
}
