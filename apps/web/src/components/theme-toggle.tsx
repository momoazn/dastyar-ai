import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui";
import { fa } from "@/lib/texts";

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const effective = theme === "system" ? resolvedTheme : theme;

  return (
    <Button
      aria-label={fa.ui.themeToggle}
      className="size-9 rounded-md transition-all duration-200 hover:scale-105 hover:bg-sidebar-accent hover:shadow-sm"
      onClick={() => setTheme(effective === "light" ? "dark" : "light")}
      size="icon"
      variant="ghost"
    >
      {effective === "light" ? (
        <Moon className="size-4 transition-transform duration-200" />
      ) : (
        <Sun className="size-4 transition-transform duration-200" />
      )}
    </Button>
  );
}
