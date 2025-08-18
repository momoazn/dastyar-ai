import { useLocation } from '@tanstack/react-router';
import {
  HomeIcon,
  Image,
  MessageCircle,
  MessageSquare,
  Mic,
} from 'lucide-react';
import { fa } from '@/lib/persian-texts';
import type { NavItem } from './types';

export const navMain: NavItem[] = [
  {
    title: fa.navigation.home,
    url: '/',
    icon: HomeIcon,
  },
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
    title: fa.navigation.imageGeneration,
    url: '/image',
    icon: Image,
  },
  {
    title: fa.navigation.transcribe,
    url: '/transcribe',
    icon: Mic,
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
