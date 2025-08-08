import { useEffect } from 'react';
import {
  ContentSidebar,
  NavigationSidebar,
  useActiveNavItem,
  useCreateThread,
  useTranslationActions,
} from '@/components/sidebar';
import { Sidebar, useSidebar } from '@/components/ui';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { setOpen } = useSidebar();
  const activeItem = useActiveNavItem();
  const { createChatThread } = useCreateThread(activeItem?.url === '/chat');
  const { handleNewTranslation } = useTranslationActions();

  const handleNew = () => {
    if (activeItem?.url === '/chat') {
      createChatThread();
    } else if (activeItem?.url === '/translation') {
      handleNewTranslation();
    }
  };

  useEffect(() => {
    const currentPath = window.location.pathname;
    if (currentPath === '/') {
      setOpen(false);
    }
  }, [setOpen]);

  return (
    <Sidebar
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      collapsible="icon"
      {...props}
    >
      <NavigationSidebar />
      {window.location.pathname !== '/' && (
        <ContentSidebar activeItem={activeItem} onNew={handleNew} />
      )}
    </Sidebar>
  );
}
