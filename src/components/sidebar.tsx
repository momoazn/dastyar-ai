import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ChevronsLeft, ChevronsRight, Settings } from "lucide-react";
import { useState } from "react";

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "flex h-full flex-col border-l border-r transition-[width] duration-300 ease-in-out",
        isCollapsed ? "w-[50px]" : "w-[280px]",
      )}
    >
      {/* Header section */}
      <div className="flex h-12 items-center justify-between border-b p-4">
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
          {!isCollapsed && (
            <>
              <div className="h-10 rounded-md border bg-muted/50" />
              <div className="h-10 rounded-md border bg-muted/50" />
              <div className="h-10 rounded-md border bg-muted/50" />
            </>
          )}
        </div>
      </ScrollArea>

      {/* Settings section */}
      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8",
            !isCollapsed && "ml-auto", // Align to right when expanded
          )}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
