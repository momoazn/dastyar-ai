import { useLocation } from "@tanstack/react-router";
import { HomeIcon, Image, MessageCircle, MessageSquare } from "lucide-react";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import type { NavItem } from "./types";

export const navMain: NavItem[] = [
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
] as const satisfies NavItem[];

export function useActiveNavItem(): NavItem | undefined {
	const location = useLocation();
	const currentPath = location.pathname;

	for (const item of navMain) {
		if (item.url === currentPath) {
			return item;
		}
	}
	return undefined;
}
