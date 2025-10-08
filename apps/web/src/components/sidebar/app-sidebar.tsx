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
      <SidebarHeader className="border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link to="/">
                <h1 className="font-semibold text-primary text-xl">
                  {fa.navigation.appTitle}
                </h1>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Navigation Items */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={activeItem?.url === item.url}
                    onClick={() => setOpen(true)}
                  >
                    <Link to={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Feature Lists */}
        {location.pathname !== '/' && activeItem && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="flex items-center justify-between px-2 py-1">
                <h3 className="font-medium text-muted-foreground text-sm">
                  {activeItem.title}
                </h3>
                <Button
                  className="h-6 w-6"
                  onClick={handleNew}
                  size="icon"
                  variant="ghost"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="px-0">
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
