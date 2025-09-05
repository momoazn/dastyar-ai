import { useLocation, useNavigate } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useEffect } from 'react';
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
  SidebarHeader,
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

  useEffect(() => {
    if (location.pathname === '/') {
      setOpen(false);
    } else {
      // Optionally open sidebar when navigating away from home
      // setOpen(true);
    }
  }, [location.pathname, setOpen]);

  // Hide sidebar completely on transcribe pages
  if (location.pathname.startsWith('/transcribe')) {
    return null;
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      {location.pathname !== '/' && (
        <Sidebar className="hidden flex-1 border-l md:flex" collapsible="none">
          <SidebarHeader className="h-14 flex-row items-center justify-between gap-3.5 border-b">
            <h3 className="ms-2 font-medium text-foreground text-lg">
              {activeItem?.title}
            </h3>
            <Button onClick={handleNew} size="icon" variant="default">
              <Plus />
            </Button>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup className="px-0">
              <SidebarGroupContent>
                {activeItem?.title === fa.navigation.chat && (
                  <ChatThreadsList />
                )}
                {activeItem?.title === fa.navigation.translation && (
                  <TranslationsList />
                )}
                {activeItem?.title === fa.navigation.summarize && (
                  <SummariesList />
                )}
                {activeItem?.title === fa.navigation.imageGeneration && (
                  <ImagesSidebar />
                )}
                {/* Transcribe doesn't have a sidebar list */}
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      )}
    </Sidebar>
  );
}
