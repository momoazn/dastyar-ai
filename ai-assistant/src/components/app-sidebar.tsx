"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { Plus, MessageSquare, ArchiveIcon, TrashIcon } from "lucide-react";
import { Button } from "./ui/button";

interface Thread {
  id: string;
  title: string;
  created: Date;
}

interface SidebarItemProps {
  title: string;
  isActive?: boolean;
  onArchive?: () => void;
  onDelete?: () => void;
}

function SidebarItem({
  title,
  isActive,
  onArchive,
  onDelete,
}: SidebarItemProps) {
  return (
    <div
      className={`hover:bg-sidebar-accent hover:text-sidebar-accent-foreground relative flex h-12 items-center justify-between border-b p-4 text-sm ${isActive ? "bg-sidebar-accent" : ""}`}
    >
      {isActive && (
        <div className="absolute top-0 right-0 h-full w-1 bg-blue-500" />
      )}

      <span className="truncate font-medium">{title ?? "Untitled"}</span>

      <div className="flex items-center gap-0 opacity-0 transition-opacity group-hover:opacity-100">
        {onArchive && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 cursor-pointer hover:text-blue-500"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onArchive();
            }}
          >
            <ArchiveIcon className="size-3" />
          </Button>
        )}

        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 cursor-pointer hover:text-red-500"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }}
          >
            <TrashIcon className="size-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Mock threads data
  const mockThreads: Thread[] = [
    { id: "1", title: "پرسش درباره پروژه", created: new Date() },
    { id: "2", title: "ایده‌های محصول", created: new Date() },
    { id: "3", title: "رفع اشکال", created: new Date() },
    { id: "4", title: "پژوهش کوتاه", created: new Date() },
  ];

  const handleNewThread = () => {
    console.log("Creating new thread");
  };

  const handleArchiveThread = (threadId: string) => {
    console.log("Archiving thread:", threadId);
  };

  const handleDeleteThread = (threadId: string) => {
    console.log("Deleting thread:", threadId);
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader className="border-b">
        <div className="flex items-center justify-between gap-2 px-2 py-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="text-sidebar-primary size-5" />
            <span className="font-semibold">
              {PERSIAN_TEXTS.navigation.chat}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={handleNewThread}
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>رشته‌های گفتگو</SidebarGroupLabel>
          <SidebarGroupContent className="px-0">
            {mockThreads.length === 0 ? (
              <div className="mt-4 flex h-full items-center justify-center">
                <p className="text-muted-foreground text-sm">
                  {PERSIAN_TEXTS.navigation.noChatThreads}
                </p>
              </div>
            ) : (
              <div className="group">
                {mockThreads.map((thread, index) => (
                  <SidebarItem
                    key={thread.id}
                    title={thread.title}
                    isActive={index === 0} // Mock first as active
                    onArchive={() => handleArchiveThread(thread.id)}
                    onDelete={() => handleDeleteThread(thread.id)}
                  />
                ))}
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
