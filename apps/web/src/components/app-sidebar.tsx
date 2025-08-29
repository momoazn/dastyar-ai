import { useLocation, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import {
  ContentSidebar,
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

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      {location.pathname !== '/' && (
        <ContentSidebar activeItem={activeItem} onNew={handleNew} />
      )}
    </Sidebar>
  );
}
