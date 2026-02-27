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
import { fa } from "@/lib/texts";

const TRAILING_SLASH_RE = /\/$/;

export type NavItem = {
  title: string;
  url: string;
  icon: React.ElementType;
  featureKey?:
    | "enable_chat"
    | "enable_image_generation"
    | "enable_code_execution"
    | "enable_translation"
    | "enable_summary"
    | "enable_transcription";
};

export type SidebarFeatureToggles = Partial<
  Record<NonNullable<NavItem["featureKey"]>, boolean>
>;

export const navMain: NavItem[] = [
  {
    title: fa.navigation.chat,
    url: "/chat/",
    icon: MessageSquare,
    featureKey: "enable_chat",
  },
  {
    title: fa.navigation.imageGeneration,
    url: "/image",
    icon: Image,
    featureKey: "enable_image_generation",
  },
  {
    title: fa.navigation.codeAssistant,
    url: "/code/",
    icon: Code,
    featureKey: "enable_code_execution",
  },
  {
    title: fa.navigation.translation,
    url: "/translation/",
    icon: MessageCircle,
    featureKey: "enable_translation",
  },
  {
    title: fa.navigation.summarize,
    url: "/summary/",
    icon: FileText,
    featureKey: "enable_summary",
  },
  {
    title: fa.navigation.transcribe,
    url: "/transcribe",
    icon: Mic,
    featureKey: "enable_transcription",
  },
] as const satisfies NavItem[];

export function getEnabledNavItems(
  items: NavItem[],
  toggles?: SidebarFeatureToggles
): NavItem[] {
  if (!toggles) {
    return items;
  }

  return items.filter((item) => {
    if (!item.featureKey) {
      return true;
    }

    return toggles[item.featureKey] !== false;
  });
}

export function useActiveNavItem(
  items: NavItem[] = navMain
): NavItem | undefined {
  const location = useLocation();
  const currentPath = location.pathname;

  for (const item of items) {
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
