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
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  useCreateChatThread,
  useDeleteChatThread,
  useGetChatThreads,
  useGetTranslations,
  useDeleteTranslation,
  useUpdateChatThread,
} from "../../generated/apiComponents";
import { Button } from "./ui/button";

type NavItem = {
  title: string;
  url: string;
  icon: React.ElementType;
};

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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { setOpen } = useSidebar();

  const activeItem = navMain.reduce(
    (bestMatch: NavItem | undefined, currentItem) => {
      if (pathname.startsWith(currentItem.url)) {
        if (!bestMatch || currentItem.url.length > bestMatch.url.length) {
          return currentItem;
        }
      }
      return bestMatch;
    },
    undefined,
  );

  const { data: chatThreads, refetch: refetchChatThreads } = useGetChatThreads(
    {
      queryParams: {
        is_archived: false,
      },
    },
    {
      enabled: activeItem?.url === "/chat",
    },
  );

  const { mutate: createChatThread } = useCreateChatThread({
    onSuccess: ({ data }) => {
      if (!data?.id) return;
      refetchChatThreads();
      navigate(`/chat/${data.id}`);
    },
  });

  const { mutate: deleteChatThread } = useDeleteChatThread({
    onSuccess: () => {
      refetchChatThreads();
    },
  });

  const { mutate: updateChatThread } = useUpdateChatThread({
    onSuccess: () => {
      refetchChatThreads();
    },
  });

  const { data: translations, refetch: refetchTranslations } =
    useGetTranslations(
      {},
      {
        enabled: activeItem?.url === "/translation",
      },
    );

  const { mutate: deleteTranslation } = useDeleteTranslation({
    onSuccess: () => {
      refetchTranslations();
    },
  });

  const handleNew = () => {
    if (activeItem?.url === "/chat") {
      createChatThread({
        body: {
          title: PERSIAN_TEXTS.navigation.newChat,
        },
      });
    } else if (activeItem?.url === "/translation") {
    }
  };

  useEffect(() => {
    if (pathname === "/") setOpen(false);
  }, [pathname]);

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-e"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                <a href="/">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Command className="size-4" />
                  </div>
                </a>
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
                        navigate(item.url);
                        setOpen(true);
                      }}
                      isActive={activeItem?.url === item.url}
                      className="px-2.5 md:px-2"
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        <SidebarHeader className="h-14 flex-row items-center justify-between gap-3.5 border-b">
          <h3 className="text-foreground ms-2 text-lg font-medium">
            {activeItem?.title}
          </h3>
          <Button variant="ghost" size="icon" onClick={handleNew}>
            <Plus />
          </Button>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              {activeItem?.url === "/chat" &&
                chatThreads?.data?.map((thread) => (
                  <InnerSidebarItem
                    to={`/chat/${thread.id}`}
                    key={thread.id}
                    title={thread.title}
                    onArchive={() => {
                      updateChatThread({
                        pathParams: {
                          id: thread.id?.toString() ?? "",
                        },
                      });
                    }}
                    onDelete={() => {
                      deleteChatThread({
                        pathParams: {
                          id: thread.id?.toString() ?? "",
                        },
                      });
                    }}
                  />
                ))}

              {activeItem?.url === "/translation" &&
                translations?.data?.map((translation) => (
                  <InnerSidebarItem
                    to={`/translation/${translation.id}`}
                    key={translation.id}
                    title={translation.translated_text?.slice(0, 20)}
                    onDelete={() => {
                      deleteTranslation({
                        pathParams: {
                          id: translation.id?.toString() ?? "",
                        },
                      });
                    }}
                  />
                ))}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  );
}

function InnerSidebarItem({
  title,
  to,
  onArchive,
  onDelete,
}: {
  title: string | undefined;
  to: string;
  onArchive?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onDelete?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <Link
      to={to}
      className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex h-12 items-center justify-between border-b p-4 text-sm"
    >
      <span className="font-medium">{title ?? "Untitled"}</span>

      <div className="flex items-center gap-0">
        {onArchive && (
          <Button
            variant="ghost"
            size="icon"
            className="cursor-pointer hover:text-blue-500"
            onClick={(e) => {
              e.preventDefault();
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
              onDelete?.(e);
            }}
          >
            <TrashIcon className="size-4" />
          </Button>
        )}
      </div>
    </Link>
  );
}
