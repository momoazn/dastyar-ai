import { Plus } from "lucide-react";

import { DeleteDialog, SettingsModal, SidebarItem } from "@/components";
import { Button, LoadingSpinner, ScrollArea } from "@/components/ui";
import { useSidebarItems } from "@/hooks/use-sidebar-items";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { cn } from "@/lib/utils";
interface SidebarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export function Sidebar({ isSidebarOpen, toggleSidebar }: SidebarProps) {
  const {
    items,
    itemsIsLoading,
    createItemMutation,
    createItemLoading,
    updateItemMutation,
    deleteItemMutation,
    deleteItemLoading,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    openDeleteDialog,
    deleteItem,
    currentMode,
  } = useSidebarItems();

  if (!isSidebarOpen) {
    return null;
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          className="bg-background/80 fixed inset-0 z-40 backdrop-blur-xs md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "bg-background z-30 flex h-full flex-col border-l md:w-[320px]",
          isSidebarOpen ? "w-[80%]" : "w-0",
        )}
        aria-label={`${currentMode} sidebar`}
      >
        {/* Create chat/project button */}
        <div className="flex justify-center border-b p-4">
          <Button
            variant="outline"
            className="flex w-full items-center justify-center gap-2"
            onClick={() =>
              createItemMutation({
                title:
                  currentMode === "chat"
                    ? PERSIAN_TEXTS.navigation.newChat
                    : PERSIAN_TEXTS.navigation.newTranslation,
              })
            }
            disabled={createItemLoading}
          >
            {createItemLoading ? (
              <LoadingSpinner className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            <span>{PERSIAN_TEXTS.navigation.new}</span>
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <nav className="rtl flex flex-col gap-1 p-4">
            {itemsIsLoading ? (
              <div className="mt-20 flex h-10 items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <ul className="list-none p-0">
                {items?.data?.map((item) => (
                  <li key={item.id}>
                    <SidebarItem
                      item={item}
                      onDelete={(e) => {
                        e.preventDefault();
                        if (e.shiftKey) {
                          deleteItemMutation({ id: item.id });
                        } else {
                          openDeleteDialog(item.id);
                        }
                      }}
                      isDeletingItem={deleteItemLoading}
                      updateItem={updateItemMutation}
                      currentMode={currentMode}
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

      {isDeleteDialogOpen && (
        <DeleteDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={deleteItem}
          isDeleting={deleteItemLoading}
        />
      )}
    </>
  );
}
