import { Plus } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { DeleteDialog, SettingsModal, SidebarItem } from "@/components";
import { Button, LoadingSpinner, ScrollArea } from "@/components/ui";
import {
  useConversations,
  useCreateConversation,
  useDeleteConversation,
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
  const [conversationToDelete, setConversationToDelete] = useState<
    number | null
  >(null);

  const {
    data: conversations,
    isLoading: isConversationsLoading,
    refetch: refetchConversations,
  } = useConversations();

  const { mutate: createThread, isPending: isCreatingThread } =
    useCreateConversation({
      onSuccess: ({ data: conversation }) => {
        navigate(`/threads/${conversation.id}/chat`);
        refetchConversations();
      },
    });

  const { mutate: deleteConversation, isPending: isDeletingConversation } =
    useDeleteConversation({
      onSuccess: () => {
        const toDeleteConversationId = conversationToDelete;
        refetchConversations();
        setDeleteDialogOpen(false);
        setConversationToDelete(null);
        if (location.pathname === `/threads/${toDeleteConversationId}/chat`) {
          navigate("/");
        }
      },
    });

  const handleDeleteConversation = (conversationId: number) => {
    setConversationToDelete(conversationId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!conversationToDelete) return;
    deleteConversation(conversationToDelete);
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
            {isConversationsLoading ? (
              <div className="mt-20 flex h-10 items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <ul className="list-none p-0">
                {conversations?.data?.map((conversation) => (
                  <li key={conversation.id}>
                    <SidebarItem
                      conversation={conversation}
                      onDelete={(e) => {
                        e.preventDefault();
                        if (e.shiftKey) {
                          deleteConversation(conversation.id);
                        } else {
                          handleDeleteConversation(conversation.id);
                        }
                      }}
                      isDeletingConversation={isDeletingConversation}
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
          isDeleting={isDeletingConversation}
        />
      )}
    </>
  );
}
