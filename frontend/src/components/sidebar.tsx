import { Plus } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { DeleteDialog, SettingsModal, SidebarItem } from "@/components";
import { Button, LoadingSpinner, ScrollArea } from "@/components/ui";
import {
  useChatThreads,
  useCreateChatThread,
  useDeleteChatThread,
} from "@/lib/api/chat";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export function Sidebar({ isSidebarOpen, toggleSidebar }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState<number | null>(null);

  const {
    data: chatThreads,
    isLoading: isChatThreadsLoading,
    refetch: refetchChatThreads,
  } = useChatThreads();

  const { mutate: createThread, isPending: isCreatingThread } =
    useCreateChatThread({
      onSuccess: ({ data: thread }) => {
        navigate(`/threads/${thread.id}/chat`);
        refetchChatThreads();
      },
    });

  const { mutate: deleteThread, isPending: isDeletingThread } =
    useDeleteChatThread({
      onSuccess: () => {
        const toDeleteThreadId = threadToDelete;
        refetchChatThreads();
        setDeleteDialogOpen(false);
        setThreadToDelete(null);
        if (location.pathname === `/threads/${toDeleteThreadId}/chat`) {
          navigate("/");
        }
      },
    });

  const handleDeleteThread = (threadId: number) => {
    setThreadToDelete(threadId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!threadToDelete) return;
    deleteThread(threadToDelete);
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
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "z-30 flex h-full flex-col border-l bg-background md:w-[320px]",
          isSidebarOpen ? "w-[80%]" : "w-0",
        )}
        aria-label="Threads sidebar"
      >
        {/* Create thread button */}
        <div className="flex justify-center border-b p-4">
          <Button
            variant="outline"
            className="flex w-full items-center justify-center gap-2"
            onClick={() => createThread(PERSIAN_TEXTS.navigation.newChat)}
            disabled={isCreatingThread}
          >
            {isCreatingThread ? (
              <LoadingSpinner className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            <span>{PERSIAN_TEXTS.navigation.newChat}</span>
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <nav className="rtl flex flex-col gap-1 p-4">
            {isChatThreadsLoading ? (
              <div className="mt-20 flex h-10 items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <ul className="list-none p-0">
                {chatThreads?.data?.map((thread) => (
                  <li key={thread.id}>
                    <SidebarItem
                      thread={thread}
                      onDelete={(e) => {
                        e.preventDefault();
                        if (e.shiftKey) {
                          deleteThread(thread.id);
                        } else {
                          handleDeleteThread(thread.id);
                        }
                      }}
                      isDeletingThread={isDeletingThread}
                    />
                  </li>
                ))}
              </ul>
            )}
          </nav>
        </ScrollArea>

        <footer className="flex h-12 items-center justify-end border-t p-4">
          {isSidebarOpen && <SettingsModal />}
        </footer>
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
