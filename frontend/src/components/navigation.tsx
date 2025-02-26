import { NavLink, useLocation } from "react-router-dom";

import { cn } from "@/lib/utils";
import { PERSIAN_TEXTS } from "../lib/persian-texts";

export function Navigation() {
  const { pathname } = useLocation();
  const threadID = pathname.split("/")?.[2];

  return (
    <nav className="flex h-16 items-center border-b border-border px-4">
      <NavigationItem to={`/threads/${threadID}/chat`}>
        {PERSIAN_TEXTS.navigation.chat}
      </NavigationItem>
      <NavigationItem to={`/threads/${threadID}/translate`}>
        {PERSIAN_TEXTS.navigation.translation}
      </NavigationItem>
      <NavigationItem to={`/image`}>
        {PERSIAN_TEXTS.navigation.imageGeneration}
      </NavigationItem>
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
