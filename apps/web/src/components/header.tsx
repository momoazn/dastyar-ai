import { Link } from "@tanstack/react-router";
import { Bot } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { fa } from "@/lib/texts";

export function Header({
  SideBarTrigger,
  showAuthLinks = false,
}: {
  SideBarTrigger?: React.ReactNode;
  showAuthLinks?: boolean;
}) {
  const hasSidebar = Boolean(SideBarTrigger);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-sidebar px-4 shadow-sm backdrop-blur-md">
      <div className="flex items-center gap-3">
        {SideBarTrigger}
        {!hasSidebar && (
          <Link
            className="flex items-center gap-2 font-medium text-gray-900 transition-colors hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400"
            to="/"
          >
            <Bot className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <span className="hidden text-lg sm:inline">
              {fa.navigation.appTitle}
            </span>
          </Link>
        )}
      </div>

      <div className="flex items-center gap-2">
        {showAuthLinks && (
          <>
            <Link
              className="font-medium text-gray-700 text-sm transition-colors hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
              to="/login"
            >
              {fa.auth.loginForm.login}
            </Link>
            <Link
              className="rounded-md bg-blue-600 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              to="/register"
            >
              {fa.auth.registerForm.register}
            </Link>
          </>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
