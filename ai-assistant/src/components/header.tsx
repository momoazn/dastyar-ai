"use client";

import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { HomeIcon, MessageSquare, MessageCircle, Image } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface HeaderProps {
  SideBarTrigger?: React.ReactNode;
}

interface NavMode {
  title: string;
  url: string;
  icon: React.ElementType;
}

const navModes: NavMode[] = [
  {
    title: PERSIAN_TEXTS.navigation.home,
    url: "/",
    icon: HomeIcon,
  },
  {
    title: PERSIAN_TEXTS.navigation.chat,
    url: "/chat",
    icon: MessageSquare,
  },
  {
    title: PERSIAN_TEXTS.navigation.translation,
    url: "/translation",
    icon: MessageCircle,
  },
  {
    title: PERSIAN_TEXTS.navigation.imageGeneration,
    url: "/image",
    icon: Image,
  },
];

export function Header({ SideBarTrigger }: HeaderProps) {
  const pathname = usePathname();

  const getActiveMode = () => {
    return navModes.find(mode => {
      if (mode.url === "/") {
        return pathname === "/";
      }
      return pathname.startsWith(mode.url);
    });
  };

  const activeMode = getActiveMode();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b px-4">
      <div className="flex items-center gap-4">
        {SideBarTrigger}
        
        {/* App Title */}
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">
            {PERSIAN_TEXTS.navigation.appTitle}
          </h1>
        </div>
      </div>

      {/* Navigation Modes + Theme Toggle */}
      <div className="flex items-center gap-1">
        <nav className="flex items-center gap-1">
          {navModes.map((mode) => {
            const isActive = activeMode?.url === mode.url;
            const Icon = mode.icon;
            
            return (
              <Button
                key={mode.url}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                asChild
                className="gap-2"
              >
                <Link href={mode.url}>
                  <Icon className="size-4" />
                  <span className="hidden sm:inline">{mode.title}</span>
                </Link>
              </Button>
            );
          })}
        </nav>
        
        {/* Theme Toggle */}
        <div className="ml-2 border-r pr-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}