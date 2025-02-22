import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { useState } from "react";
import { SettingsModal } from "./settings-modal";

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "flex h-full flex-col border-l border-r transition-[width] duration-300 ease-in-out",
        isCollapsed ? "w-[50px]" : "w-[340px]",
      )}
    >
      {/* Header section */}
      <div className="flex h-16 items-center justify-between border-b p-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronsLeft className="h-4 w-4" />
          ) : (
            <ChevronsRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Chat list section */}
      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col gap-2">
          {/* Placeholder for chat list */}
          {/* {!isCollapsed && (
            <>
              <div className="h-10 rounded-md border bg-muted/50" />
              <div className="h-10 rounded-md border bg-muted/50" />
              <div className="h-10 rounded-md border bg-muted/50" />
            </>
          )} */}
        </div>
      </ScrollArea>

      {/* Footer with settings button */}
      <div className="flex h-12 items-center justify-end border-t p-4">
        {!isCollapsed && <SettingsModal />}
      </div>
    </div>
  );
}
