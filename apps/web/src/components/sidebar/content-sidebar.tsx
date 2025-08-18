import { Plus } from 'lucide-react';
import {
  Button,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
} from '@/components/ui';
import { ChatThreadsList } from './chat-threads-list';
import { SummariesList } from './summaries-list';
import { TranslationsList } from './translations-list';
import type { ContentSidebarProps } from './types';

export function ContentSidebar({ activeItem, onNew }: ContentSidebarProps) {
  return (
    <Sidebar className="hidden flex-1 md:flex" collapsible="none">
      <SidebarHeader className="h-14 flex-row items-center justify-between gap-3.5 border-b">
        <h3 className="ms-2 font-medium text-foreground text-lg">
          {activeItem?.title}
        </h3>
        <Button
          className="cursor-pointer"
          onClick={onNew}
          size="icon"
          variant="secondary"
        >
          <Plus />
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="px-0">
          <SidebarGroupContent>
            <ChatThreadsList />
            <TranslationsList />
            <SummariesList />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
