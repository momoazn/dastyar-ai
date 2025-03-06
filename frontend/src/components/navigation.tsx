import { NavLink, useLocation } from "react-router-dom";

import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { cn } from "@/lib/utils";

export function Navigation() {
  const { pathname } = useLocation();
  const threadId = pathname.split("/")?.[2];

  const routes = [
    {
      path: threadId ? `/threads/${threadId}/chat` : "/chat",
      label: PERSIAN_TEXTS.navigation.chat,
    },
    {
      path: threadId ? `/threads/${threadId}/translate` : "/translate",
      label: PERSIAN_TEXTS.navigation.translation,
    },
    {
      path: "/image",
      label: PERSIAN_TEXTS.navigation.imageGeneration,
    },
  ];

  return (
    <nav className="flex h-16 items-center border-b border-border px-4">
      {routes.map((route) => (
        <NavigationItem key={route.path} to={route.path}>
          {route.label}
        </NavigationItem>
      ))}
    </nav>
  );
}

function NavigationItem({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "text-md rounded-md px-6 py-2",
          isActive ? "bg-primary/10 text-primary" : "",
        )
      }
    >
      {children}
    </NavLink>
  );
}
