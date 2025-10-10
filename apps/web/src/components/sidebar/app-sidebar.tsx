import { useLocation, useNavigate } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import {
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
} from '@/components/ui';
import { fa } from '@/lib/persian-texts';
import { ChatThreadsList } from './chat-threads-list';
import { ImagesSidebar } from './images-sidebar';
import { AppSidebarHeader, NavigationMenu } from './navigation';
import { SummariesList } from './summaries-list';
import { TranslationsList } from './translations-list';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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

  const renderFeatureList = () => {
    if (!activeItem || location.pathname === '/') {
      return null;
    }

    switch (activeItem.title) {
      case fa.navigation.chat:
        return <ChatThreadsList />;
      case fa.navigation.translation:
        return <TranslationsList />;
      case fa.navigation.summarize:
        return <SummariesList />;
      case fa.navigation.imageChats:
        return <ImagesSidebar />;
      default:
        return null;
    }
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <AppSidebarHeader variant="full" />

      <SidebarContent className="gap-2 px-2 py-2 pr-0">
        {/* Navigation Items */}
        <SidebarGroup className="pr-1">
          <SidebarGroupContent>
            <NavigationMenu className="gap-0.5" variant="full" />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Feature Lists */}
        {location.pathname !== '/' && activeItem && (
          <SidebarGroup className="pt-1 pr-1">
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
              <div className="space-y-0.5 px-0">{renderFeatureList()}</div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
