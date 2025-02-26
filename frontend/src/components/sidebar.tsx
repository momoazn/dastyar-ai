import { ChevronsLeft, ChevronsRight, MessageSquare, Plus } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Thread, useCreateThread, useThreads } from "@/lib/api/chat";
import { cn } from "@/lib/utils";
import { SettingsModal } from "./settings-modal";
import { LoadingSpinner } from "./ui/loading-spinner";

interface SidebarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export function Sidebar({ isSidebarOpen, toggleSidebar }: SidebarProps) {
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
        {/* Toggle sidebar button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={toggleSidebar}
        >
          {!isSidebarOpen ? (
            <ChevronsLeft className="h-4 w-4" />
          ) : (
            <ChevronsRight className="h-4 w-4" />
          )}
        </Button>
        {/* Create new thread button */}
        {isSidebarOpen && (
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
        )}
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
                  <SidebarItem key={thread.id} thread={thread} />
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

function SidebarItem({ thread }: { thread: Thread }) {
  const { pathname } = useLocation();

  const isActive =
    pathname.startsWith("/threads") && pathname.includes(thread.id.toString());

  return (
    <NavLink
      key={thread.id}
      to={`/threads/${thread.id}/chat`}
      className={cn(
        "flex h-10 items-center gap-2 text-wrap rounded-md ps-2 text-sm text-muted-foreground",
        isActive ? "bg-primary/10 text-primary" : "",
      )}
    >
      <MessageSquare className="h-4 w-4" />
      <span>
        {thread.title
          ? thread.title.length > 24
            ? `${thread.title.slice(0, 20)}...`
            : thread.title
          : "New Chat"}
      </span>
    </NavLink>
  );
}
