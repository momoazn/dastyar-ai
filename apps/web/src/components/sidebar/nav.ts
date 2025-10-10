import { useLocation } from '@tanstack/react-router';
import {
  Code,
  FileText,
  Image,
  MessageCircle,
  MessageSquare,
  Mic,
} from 'lucide-react';
import type React from 'react';
import { fa } from '@/lib/persian-texts';

export interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
}

export const navMain: NavItem[] = [
  {
    title: fa.navigation.chat,
    url: '/chat',
    icon: MessageSquare,
  },
  {
    title: fa.navigation.translation,
    url: '/translation',
    icon: MessageCircle,
  },
  {
    title: fa.navigation.summarize,
    url: '/summarize',
    icon: FileText,
  },
  {
    title: fa.navigation.transcribe,
    url: '/transcribe',
    icon: Mic,
  },
  {
    title: fa.navigation.imageChats,
    url: '/image',
    icon: Image,
  },
  {
    title: fa.navigation.codeAssistant,
    url: '/code',
    icon: Code,
  },
] as const satisfies NavItem[];

export function useActiveNavItem(): NavItem | undefined {
  const location = useLocation();
  const currentPath = location.pathname;

  for (const item of navMain) {
    if (currentPath === item.url || currentPath.startsWith(`${item.url}/`)) {
      return item;
    }
  }
  return;
}
