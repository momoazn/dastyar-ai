import { MessageSquare, Plus, X } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Thread,
  useCreateThread,
  useDeleteThread,
  useThreads,
} from "@/lib/api/chat";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { SettingsModal } from "./settings-modal";
import { LoadingSpinner } from "./ui/loading-spinner";

interface SidebarProps {
  isSidebarOpen: boolean;
}

export function Sidebar({ isSidebarOpen }: SidebarProps) {
  const navigate = useNavigate();

  const {
    data: threads,
    isLoading: isThreadsLoading,
    refetch: refetchThreads,
  } = useThreads();

  const { mutate: createThread, isPending: isCreatingThread } = useCreateThread(
    {
      onSuccess: ({ data: thread }) => {
        navigate(`/threads/${thread.id}/chat`);
        refetchThreads();
      },
    },
  );

  const { mutate: deleteThread, isPending: isDeletingThread } = useDeleteThread(
    {
      onSuccess: () => {
        refetchThreads();
      },
    },
  );

  const handleDeleteThread = (threadId: number) => {
    if (
      confirm(`آیا از حذف این چت مطمئن هستید؟
همراه با حذف پیام‌ها و ترجمه‌ها و تصاویر تولید شده نیز حذف می‌شوند!
این فعل برای همیشه انجام خواهد شد و قابل بازگردانی نیست.`)
    ) {
      deleteThread(threadId);
    }
  };

  if (!isSidebarOpen) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex h-full flex-col border-l border-r transition-[width] duration-300 ease-in-out",
        !isSidebarOpen ? "w-0 overflow-hidden" : "w-[340px]",
      )}
    >
      {/* Header section */}
      <div
        className={cn("flex h-16 items-center justify-between border-b p-4")}
      >
        <h1 className="text-2xl font-semibold text-primary">
          {PERSIAN_TEXTS.navigation.appTitle}
        </h1>

        {/* Create new thread button */}
        <Button
          variant="default"
          size="icon"
          onClick={() => createThread("New Chat")}
          disabled={isCreatingThread}
        >
          {isCreatingThread ? (
            <LoadingSpinner className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Chat list section */}
      <ScrollArea className="flex-1 p-4">
        <div className="rtl flex flex-col gap-1">
          {isSidebarOpen && (
            <>
              {isThreadsLoading ? (
                <div className="mt-20 flex h-10 items-center justify-center">
                  <LoadingSpinner />
                </div>
              ) : (
                threads?.data?.map((thread) => (
                  <SidebarItem
                    key={thread.id}
                    thread={thread}
                    onDelete={() => handleDeleteThread(thread.id)}
                    isDeletingThread={isDeletingThread}
                  />
                ))
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Footer with settings button */}
      <div className="flex h-12 items-center justify-end border-t p-4">
        {isSidebarOpen && <SettingsModal />}
      </div>
    </div>
  );
}

function SidebarItem({
  thread,
  onDelete,
  isDeletingThread,
}: {
  thread: Thread;
  onDelete: () => void;
  isDeletingThread: boolean;
}) {
  const { pathname } = useLocation();
  const [isHovering, setIsHovering] = useState(false);

  const isActive =
    pathname.startsWith("/threads") && pathname.includes(thread.id.toString());

  return (
    <NavLink
      key={thread.id}
      to={`/threads/${thread.id}/chat`}
      className={cn(
        "flex h-10 items-center justify-between gap-2 text-wrap rounded-md px-2 ps-2 text-sm text-muted-foreground",
        isActive ? "bg-primary/10 text-primary" : "",
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        <span>
          {thread.title
            ? thread.title.length > 24
              ? `${thread.title.slice(0, 20)}...`
              : thread.title
            : "New Chat"}
        </span>
      </div>
      {isHovering && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          disabled={isDeletingThread}
          className={
            "h-6 w-6 bg-transparent hover:bg-transparent hover:text-red-500"
          }
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </NavLink>
  );
}
