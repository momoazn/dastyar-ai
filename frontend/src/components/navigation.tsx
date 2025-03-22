import { NavLink, NavLinkProps, useLocation } from "react-router-dom";

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
      path: threadId ? `/threads/${threadId}/image` : "/image",
      label: PERSIAN_TEXTS.navigation.imageGeneration,
    },
  ];

  return (
    <ul className="flex items-center h-12 mr-4 gap-1">
      {routes.map((route) => (
        <li key={route.path}>
          <NavigationItem to={route.path}>
            {route.label}
          </NavigationItem>
        </li>
      ))}
    </ul>
  );
}

function NavigationItem(props: NavLinkProps) {
  return (
    <NavLink
      {...props}
      className={({ isActive }) =>
        cn(
          "block text-md rounded-md px-4 py-1",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground",
        )
      }
    />
  );
}
