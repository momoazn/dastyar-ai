import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useServices } from "@/context/service-context";
import { useModelSelection } from "@/hooks/use-model-selection";
import { cn } from "@/lib/utils";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { useState } from "react";

export type ModelSelectionProps = {
  selectedOllamaModel: string;
  selectedWhisperModel: string;
};

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { ollamaModels, whisperModels } = useServices();
  const {
    selectedOllamaModel,
    selectedWhisperModel,
    setOllamaModel,
    setWhisperModel,
  } = useModelSelection();

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

      {/* Model selection section at bottom */}
      {!isCollapsed && (
        <div className="border-t p-4">
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              مدل‌های هوش مصنوعی
            </h3>
            <div className="flex flex-col gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium">مدل چت</label>
                <Select
                  value={selectedOllamaModel}
                  onValueChange={setOllamaModel}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب مدل چت" />
                  </SelectTrigger>
                  <SelectContent>
                    {ollamaModels?.map((model) => (
                      <SelectItem key={model} value={model || "default"}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">مدل تشخیص گفتار</label>
                <Select
                  value={selectedWhisperModel}
                  onValueChange={setWhisperModel}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب مدل تشخیص گفتار" />
                  </SelectTrigger>
                  <SelectContent>
                    {whisperModels?.map((model) => (
                      <SelectItem key={model} value={model || "default"}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
