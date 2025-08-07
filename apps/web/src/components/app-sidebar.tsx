import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import {
  ArchiveIcon,
  Command,
  HomeIcon,
  Image,
  MessageCircle,
  MessageSquare,
  Plus,
  TrashIcon,
} from "lucide-react";
import { useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/ui";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
}

interface SidebarItemProps {
  title: string | undefined;
  to: string;
  onArchive?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onDelete?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

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

function useActiveNavItem() {
  // Mock active item - in real app would use router location
  return navMain[1]; // Return chat as active for demo
}

function useChatThreadsData(isActive: boolean) {
  const navigate = useNavigate();

  // Mock data
  const chatThreads = isActive
    ? {
        items: [
          { id: "1", title: "گفتگوی جدید", created: "2024-01-01" },
          { id: "2", title: "مکالمه درباره هوش مصنوعی", created: "2024-01-02" },
        ],
      }
    : { items: [] };

  const createChatThread = () => {
    console.log("Create new chat thread");
    navigate({ to: "/chat" });
  };

  const deleteChatThread = (id: string) => {
    console.log("Delete chat thread:", id);
  };

  const updateChatThread = (id: string) => {
    console.log("Archive chat thread:", id);
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

function NavigationSidebar() {
  const navigate = useNavigate();
  const { setOpen } = useSidebar();
  const activeItem = useActiveNavItem();

  return (
    <Sidebar
      collapsible="none"
      className="w-[calc(var(--sidebar-width-icon)+1px)]! border-e"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
              <Link to="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="px-1.5 md:px-0">
            <SidebarMenu>
              {navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={{
                      children: item.title,
                      hidden: false,
                      side: "left",
                    }}
                    onClick={() => {
                      navigate({ to: item.url });
                      setOpen(true);
                    }}
                    isActive={activeItem?.url === item.url}
                    className="px-2.5 md:px-2"
                  >
                    <item.icon className="size-8" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function SidebarItem({ title, to, onArchive, onDelete }: SidebarItemProps) {
  return (
    <Link
      to={to}
      className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground relative flex h-12 items-center justify-between border-b p-4 text-sm"
    >
      {({ isActive }) => {
        return (
          <>
            {isActive && (
              <div className="absolute top-0 right-0 h-full w-1 bg-blue-500" />
            )}

            <span className="font-medium">{title ?? "Untitled"}</span>

            <div className="flex items-center gap-0">
              {onArchive && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="cursor-pointer hover:text-blue-500"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onArchive?.(e);
                  }}
                >
                  <ArchiveIcon className="size-4" />
                </Button>
              )}

              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="cursor-pointer hover:text-red-500"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete?.(e);
                  }}
                >
                  <TrashIcon className="size-4" />
                </Button>
              )}
            </div>
          </>
        );
      }}
    </Link>
  );
}

function ChatThreadsList() {
  const activeItem = useActiveNavItem();
  const isActive = activeItem?.url === "/chat";

  const navigate = useNavigate();
  const { chatThreads, deleteChatThread, updateChatThread } =
    useChatThreadsData(isActive);

  if (!isActive) return null;

  return (
    <>
      {chatThreads?.items?.length === 0 && (
        <div className="mt-4 flex h-full items-center justify-center">
          <p className="text-muted-foreground text-sm">
            {PERSIAN_TEXTS.navigation.noChatThreads}
          </p>
        </div>
      )}

      {chatThreads?.items?.map((thread) => (
        <SidebarItem
          to={`/chat?id=${thread.id}`}
          key={thread.id}
          title={thread.title}
          onArchive={() => updateChatThread(thread.id)}
          onDelete={() => {
            deleteChatThread(thread.id);
            navigate({ to: "/chat" });
          }}
        />
      ))}
    </>
  );
}

function TranslationsList() {
  const activeItem = useActiveNavItem();
  const isActive = activeItem?.url === "/translation";
  const navigate = useNavigate();
  const { translations, deleteTranslation } = useTranslationsData(isActive);

  if (!isActive) return null;

  return (
    <>
      {translations?.items?.map((translation) => (
        <SidebarItem
          to={`/translation?id=${translation.id}`}
          key={translation.id}
          title={translation.sourceText?.slice(0, 30) || "بدون عنوان"}
          onDelete={(e) => {
            e.stopPropagation();
            if (translation.id) {
              deleteTranslation(translation.id);
              navigate({ to: "/translation" });
            }
          }}
        />
      ))}
    </>
  );
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

// Main component
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const navigate = useNavigate();
  const { setOpen } = useSidebar();
  const activeItem = useActiveNavItem();
  const { createChatThread } = useChatThreadsData(activeItem?.url === "/chat");
  const { handleNewTranslation } = useTranslationsData(
    activeItem?.url === "/translation"
  );

  const handleNew = () => {
    if (activeItem?.url === "/chat") {
      createChatThread();
    } else if (activeItem?.url === "/translation") {
      handleNewTranslation();
    }
  };

  useEffect(() => {
    // Close sidebar on home page
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
