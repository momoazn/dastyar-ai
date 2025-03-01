import { Plus } from "lucide-react";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCreateThread, useDeleteThread, useThreads } from "@/lib/api/chat";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { cn } from "@/lib/utils";
import { DeleteDialog } from "./delete-dialog";
import { SettingsModal } from "./settings-modal";
import { SidebarItem } from "./sidebar-item";
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

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState<number | null>(null);

  const { mutate: deleteThread, isPending: isDeletingThread } = useDeleteThread(
    {
      onSuccess: () => {
        refetchThreads();
        setDeleteDialogOpen(false);
        setThreadToDelete(null);
      },
    },
  );

  const handleDeleteThread = (
    e: React.MouseEvent<HTMLButtonElement>,
    threadId: number,
  ) => {
    e.preventDefault();
    setThreadToDelete(threadId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (threadToDelete) {
      deleteThread(threadToDelete);
    }
  };

  if (!isSidebarOpen) {
    return null;
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={toggleSidebar}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex h-full w-[80%] flex-col border-l border-r bg-background transition-transform duration-300 ease-in-out md:static md:w-[400px]",
          isSidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0",
        )}
      >
        {/* Header section */}
        <div
          className={cn("flex h-16 items-center justify-between border-b p-4")}
        >
          <NavLink to="/">
            <h1 className="text-2xl font-semibold text-primary">
              {PERSIAN_TEXTS.navigation.appTitle}
            </h1>
          </NavLink>

          {/* Create new thread button */}
          <Button
            variant="default"
            size="icon"
            onClick={() => createThread(PERSIAN_TEXTS.navigation.newChat)}
            disabled={isCreatingThread}
          >
            {isCreatingThread ? (
              <LoadingSpinner className="h-4 w-4" />
            ) : (
              <Plus className="h-12 w-12" />
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
                      onDelete={(e) => handleDeleteThread(e, thread.id)}
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
      </aside>

      {deleteDialogOpen && (
        <DeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={confirmDelete}
          isDeleting={isDeletingThread}
        />
      )}
    </>
  );
}
