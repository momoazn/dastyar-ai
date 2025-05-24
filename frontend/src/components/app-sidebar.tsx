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
import { useChatThreads, useTranslations } from "@/lib/api";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import {
  Command,
  HomeIcon,
  Image,
  MessageCircle,
  MessageSquare,
  Plus,
} from "lucide-react";
import * as React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
    title: PERSIAN_TEXTS.navigation.imageGeneration,
    url: "/image",
    icon: Image,
  },
  {
    title: PERSIAN_TEXTS.navigation.translation,
    url: "/translation",
    icon: MessageCircle,
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

  const { data: chatThreads } = useChatThreads({
    enabled: activeItem?.url === "/chat",
  });
  const { data: translations } = useTranslations({
    enabled: activeItem?.url === "/translation",
  });

  React.useEffect(() => {
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
          <Button variant="ghost" size="icon">
            <Plus />
          </Button>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              {activeItem?.url === "/chat" &&
                chatThreads?.data?.map((thread) => (
                  <Link
                    to={`/chat/${thread.id}`}
                    key={thread.id}
                    className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight whitespace-nowrap last:border-b-0"
                  >
                    <span className="font-medium">{thread.title}</span>
                  </Link>
                ))}
              {activeItem?.url === "/translation" &&
                translations?.data?.map((translation) => (
                  <Link
                    to={`/translation/${translation.id}`}
                    key={translation.id}
                    className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight whitespace-nowrap last:border-b-0"
                  >
                    <span>{translation.translated_text.slice(0, 10)}</span>
                  </Link>
                ))}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  );
}
