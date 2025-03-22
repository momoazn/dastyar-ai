import { NavLink, NavLinkProps } from "react-router-dom";

import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { cn } from "@/lib/utils";

export function Navigation() {
  const routes = [
    {
      path: "/chat",
      label: PERSIAN_TEXTS.navigation.chat,
    },
    {
      path: "/translate",
      label: PERSIAN_TEXTS.navigation.translation,
    },
    {
      path: "/image",
      label: PERSIAN_TEXTS.navigation.imageGeneration,
    },
  ];

  return (
    <ul className="mr-4 flex h-12 items-center gap-1">
      {routes.map((route) => (
        <li key={route.path}>
          <NavigationItem to={route.path}>{route.label}</NavigationItem>
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
          "text-md block rounded-md px-4 py-1",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground",
        )
      }
    />
  );
}
