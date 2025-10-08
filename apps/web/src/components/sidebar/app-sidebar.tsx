import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import {
  navMain,
  useActiveNavItem,
  useCreateThread,
  useTranslationActions,
} from '@/components/sidebar';
import {
  Button,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui';
import { fa } from '@/lib/persian-texts';
import { ChatThreadsList } from './chat-threads-list';
import { ImagesSidebar } from './images-sidebar';
import { SummariesList } from './summaries-list';
import { TranslationsList } from './translations-list';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { setOpen } = useSidebar();
  const activeItem = useActiveNavItem();
  const { createChatThread } = useCreateThread(activeItem?.url === '/chat');
  const { handleNewTranslation } = useTranslationActions();
  const location = useLocation();
  const navigate = useNavigate();

  const handleNew = () => {
    if (activeItem?.url === '/chat') {
      createChatThread();
    } else if (activeItem?.url === '/translation') {
      handleNewTranslation();
    } else if (location.pathname.startsWith('/image')) {
      navigate({ to: '/image' });
    }
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="flex h-14 flex-row items-center bg-sidebar backdrop-blur-md">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="h-10 hover:bg-sidebar-accent/50"
              size="default"
            >
              <Link to="/">
                <h1 className="bg-gradient-to-l from-primary to-primary/70 bg-clip-text font-bold text-lg text-transparent tracking-tight">
                  {fa.navigation.appTitle}
                </h1>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-2 px-2 py-2">
        {/* Navigation Items */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className="h-9 rounded-md transition-all duration-200 hover:scale-[1.01] hover:shadow-sm"
                    isActive={activeItem?.url === item.url}
                    onClick={() => setOpen(true)}
                  >
                    <Link to={item.url}>
                      <item.icon className="size-4" />
                      <span className="font-medium text-sm">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Feature Lists */}
        {location.pathname !== '/' && activeItem && (
          <SidebarGroup className="pt-1">
            <SidebarGroupContent>
              <div className="mb-2 flex items-center justify-between rounded-md bg-sidebar-accent/40 px-2.5 py-1.5">
                <h3 className="font-semibold text-sidebar-foreground text-xs">
                  {activeItem.title}
                </h3>
                <Button
                  className="h-6 w-6 rounded-md bg-primary/10 transition-all duration-200 hover:scale-105 hover:bg-primary hover:text-primary-foreground"
                  onClick={handleNew}
                  size="icon"
                  variant="ghost"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-0.5 px-0">
                {activeItem.title === fa.navigation.chat && <ChatThreadsList />}
                {activeItem.title === fa.navigation.translation && (
                  <TranslationsList />
                )}
                {activeItem.title === fa.navigation.summarize && (
                  <SummariesList />
                )}
                {activeItem.title === fa.navigation.imageGeneration && (
                  <ImagesSidebar />
                )}
                {/* Transcribe doesn't have a sidebar list */}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
