import { useLocation } from "@tanstack/react-router";
import {
  Code,
  FileText,
  Image,
  MessageCircle,
  MessageSquare,
  Mic,
} from "lucide-react";
import type React from "react";
import { fa } from "@/lib/persian-texts";

const TRAILING_SLASH_RE = /\/$/;

export type NavItem = {
  title: string;
  url: string;
  icon: React.ElementType;
};

export const navMain: NavItem[] = [
  {
    title: fa.navigation.chat,
    url: "/chat/",
    icon: MessageSquare,
  },
  {
    title: fa.navigation.translation,
    url: "/translation/",
    icon: MessageCircle,
  },
  {
    title: fa.navigation.summarize,
    url: "/summary/",
    icon: FileText,
  },
  {
    title: fa.navigation.transcribe,
    url: "/transcribe",
    icon: Mic,
  },
  {
    title: fa.navigation.imageGeneration,
    url: "/image",
    icon: Image,
  },
  {
    title: fa.navigation.codeAssistant,
    url: "/code/",
    icon: Code,
  },
] as const satisfies NavItem[];

export function useActiveNavItem(): NavItem | undefined {
  const location = useLocation();
  const currentPath = location.pathname;

  for (const item of navMain) {
    // Normalize both paths for comparison (remove trailing slash if present)
    const normalizedItemUrl = item.url.replace(TRAILING_SLASH_RE, "");
    const normalizedCurrentPath = currentPath.replace(TRAILING_SLASH_RE, "");

    if (
      normalizedCurrentPath === normalizedItemUrl ||
      normalizedCurrentPath.startsWith(`${normalizedItemUrl}/`)
    ) {
      return item;
    }
  }
  return;
}
