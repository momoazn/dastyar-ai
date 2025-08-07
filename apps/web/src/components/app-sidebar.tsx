import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import {
	HomeIcon,
	Image,
	MessageCircle,
	MessageSquare,
	Plus,
} from "lucide-react";
import { useEffect } from "react";
import {
	ChatThreadsList,
	type NavItem,
	NavigationSidebar,
	TranslationsList,
} from "@/components/sidebar";
import {
	Button,
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	useSidebar,
} from "@/components/ui";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { client, orpc, queryClient } from "@/utils/orpc";

interface ContentSidebarProps {
	activeItem: NavItem | undefined;
	onNew: () => void;
}

const navMain: NavItem[] = [
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

function useActiveNavItem(): NavItem | undefined {
	const location = useLocation();
	const currentPath = location.pathname;

	for (const item of navMain) {
		if (item.url === currentPath) {
			return item;
		}
	}
	return undefined;
}

function useChatThreadsData(isActive: boolean) {
	const navigate = useNavigate();

	const listQuery = useQuery({
		...orpc.threads.list.queryOptions({ includeArchived: false }),
		enabled: isActive,
	});

	const createMutation = useMutation({
		mutationFn: (title?: string) => client.threads.create({ title }),
		onSuccess: (res) => {
			void queryClient.invalidateQueries();
			navigate({ to: "/chat", search: { id: res.id } });
		},
	});

	const deleteMutation = useMutation({
		mutationFn: ({ id }: { id: string }) => client.threads.delete({ id }),
		onSuccess: () => void queryClient.invalidateQueries(),
	});

	const archiveMutation = useMutation({
		mutationFn: ({ id, isArchived }: { id: string; isArchived: boolean }) =>
			client.threads.archive({ id, isArchived }),
		onSuccess: () => void queryClient.invalidateQueries(),
	});

	const chatThreads = {
		items: (listQuery.data ?? []).map((t: any) => ({
			id: t.id as string,
			title: t.title as string,
			created: t.createdAt ? String(t.createdAt) : "",
			isArchived: Boolean(t.isArchived),
		})),
	};

	const createChatThread = () => createMutation.mutate(undefined);

	const deleteChatThread = (id: string) => deleteMutation.mutate({ id });

	const updateChatThread = (id: string) => {
		const current = (listQuery.data ?? []).find((t: any) => t.id === id);
		const nextArchived = current ? !current.isArchived : true;
		archiveMutation.mutate({ id, isArchived: nextArchived });
	};

	return {
		chatThreads,
		createChatThread,
		deleteChatThread,
		updateChatThread,
	};
}

function useTranslationsData(isActive: boolean) {
	const navigate = useNavigate();

	// Mock data
	const translations = isActive
		? {
				items: [
					{
						id: "1",
						sourceText: "Hello world",
						translatedText: "سلام دنیا",
						created: "2024-01-01",
					},
					{
						id: "2",
						sourceText: "How are you?",
						translatedText: "حال شما چطور است؟",
						created: "2024-01-02",
					},
				],
			}
		: { items: [] };

	const deleteTranslation = (id: string) => {
		console.log("Delete translation:", id);
	};

	const handleNewTranslation = () => navigate({ to: "/translation" });

	return {
		translations,
		deleteTranslation,
		handleNewTranslation,
	};
}

function ContentSidebar({ activeItem, onNew }: ContentSidebarProps) {
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { setOpen } = useSidebar();
	const activeItem = useActiveNavItem();
	const { createChatThread } = useChatThreadsData(activeItem?.url === "/chat");
	const { handleNewTranslation } = useTranslationsData(
		activeItem?.url === "/translation",
	);

	const handleNew = () => {
		if (activeItem?.url === "/chat") {
			createChatThread();
		} else if (activeItem?.url === "/translation") {
			handleNewTranslation();
		}
	};

	useEffect(() => {
		const currentPath = window.location.pathname;
		if (currentPath === "/") setOpen(false);
	}, [setOpen]);

	return (
		<Sidebar
			collapsible="icon"
			className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
			{...props}
		>
			<NavigationSidebar />
			{window.location.pathname !== "/" && (
				<ContentSidebar activeItem={activeItem} onNew={handleNew} />
			)}
		</Sidebar>
	);
}
