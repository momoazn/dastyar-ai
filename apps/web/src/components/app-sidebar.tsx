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
import { Link } from "@tanstack/react-router";
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
  // Mock data
  const chatThreads = isActive
    ? [
        { id: "1", title: "گفتگوی جدید", created: "2024-01-01" },
        { id: "2", title: "مکالمه درباره هوش مصنوعی", created: "2024-01-02" },
      ]
    : [];

  const createChatThread = () => {
    console.log("Create new chat thread");
  };

  return { chatThreads, createChatThread };
}

function useTranslationsData(isActive: boolean) {
  // Mock data
  const translations = isActive
    ? [
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
      ]
    : [];

  const createTranslation = () => {
    console.log("Create new translation");
  };

  return { translations, createTranslation };
}

function NavigationSidebar() {
  const { setOpen } = useSidebar();
  const activeItem = useActiveNavItem();

  return (
    <SidebarContent>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Command className="h-4 w-4" />
          <span className="text-sm font-semibold">Navigation</span>
        </div>
      </SidebarHeader>

      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {navMain.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem?.url === item.url;

              return (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    onClick={() => setOpen(false)}
                  >
                    <Link to={item.url}>
                      <Icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  );
}

function SidebarItem({ title, to, onArchive, onDelete }: SidebarItemProps) {
  return (
    <div className="group flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-accent">
      <Link to={to} className="flex-1 truncate">
        {title}
      </Link>
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {onArchive && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onArchive}
          >
            <ArchiveIcon className="h-3 w-3" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onDelete}
          >
            <TrashIcon className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

function ChatThreadsList() {
  const { chatThreads, createChatThread } = useChatThreadsData(true);

  return (
    <SidebarGroup>
      <SidebarHeader>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Chat Threads</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={createChatThread}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </SidebarHeader>
      <SidebarGroupContent>
        {chatThreads.length === 0 ? (
          <div className="text-muted-foreground px-3 py-2 text-sm">
            {PERSIAN_TEXTS.navigation.noChatThreads}
          </div>
        ) : (
          chatThreads.map((thread) => (
            <SidebarItem
              key={thread.id}
              title={thread.title}
              to={`/chat?id=${thread.id}`}
            />
          ))
        )}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function TranslationsList() {
  const { translations, createTranslation } = useTranslationsData(true);

  return (
    <SidebarGroup>
      <SidebarHeader>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Translations</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={createTranslation}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </SidebarHeader>
      <SidebarGroupContent>
        {translations.length === 0 ? (
          <div className="text-muted-foreground px-3 py-2 text-sm">
            No translations yet
          </div>
        ) : (
          translations.map((translation) => (
            <SidebarItem
              key={translation.id}
              title={translation.sourceText}
              to={`/translation?id=${translation.id}`}
            />
          ))
        )}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function ContentSidebar({ activeItem, onNew }: ContentSidebarProps) {
  return (
    <SidebarContent>
      <SidebarHeader>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">{activeItem?.title}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onNew}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </SidebarHeader>

      {activeItem?.url === "/chat" && <ChatThreadsList />}
      {activeItem?.url === "/translation" && <TranslationsList />}
    </SidebarContent>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const activeItem = useActiveNavItem();

  const handleNew = () => {
    if (activeItem?.url === "/chat") {
      console.log("Create new chat");
    } else if (activeItem?.url === "/translation") {
      console.log("Create new translation");
    }
  };

  return (
    <Sidebar {...props}>
      <NavigationSidebar />
      <ContentSidebar activeItem={activeItem} onNew={handleNew} />
    </Sidebar>
  );
}
