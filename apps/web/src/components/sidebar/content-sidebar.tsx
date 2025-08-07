import { Plus } from "lucide-react";
import {
	Button,
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
} from "@/components/ui";
import { ChatThreadsList } from "./chat-threads-list";
import { TranslationsList } from "./translations-list";
import type { ContentSidebarProps } from "./types";

export function ContentSidebar({ activeItem, onNew }: ContentSidebarProps) {
	return (
		<Sidebar collapsible="none" className="hidden flex-1 md:flex">
			<SidebarHeader className="h-14 flex-row items-center justify-between gap-3.5 border-b">
				<h3 className="text-foreground ms-2 text-lg font-medium">
					{activeItem?.title}
				</h3>
				<Button variant="ghost" size="icon" onClick={onNew}>
					<Plus />
				</Button>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup className="px-0">
					<SidebarGroupContent>
						<ChatThreadsList />
						<TranslationsList />
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	);
}
