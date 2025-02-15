import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useServices } from "@/context/service-context";
import { samplers, useImageSettings } from "@/hooks/use-image-settings";
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
  const { settings, setSettings } = useImageSettings();

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

      {!isCollapsed && (
        <div className="border-t">
          {/* Model selection section */}
          <div className="border-b p-4">
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

          {/* Image settings section */}
          <div className="p-4">
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                تنظیمات تصویر
              </h3>
              <div className="flex flex-col gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium">اندازه</label>
                  <Select
                    value={settings.width.toString()}
                    onValueChange={(value) =>
                      setSettings({
                        ...settings,
                        width: parseInt(value),
                        height: parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب اندازه" />
                    </SelectTrigger>
                    <SelectContent>
                      {[256, 512, 768, 1024].map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}x{size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">سمپلر</label>
                  <Select
                    value={settings.sampler_index}
                    onValueChange={(value) =>
                      setSettings({
                        ...settings,
                        sampler_index: value as typeof settings.sampler_index,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب سمپلر" />
                    </SelectTrigger>
                    <SelectContent>
                      {samplers.map((sampler) => (
                        <SelectItem key={sampler} value={sampler}>
                          {sampler}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium">
                      مقیاس راهنمایی
                    </label>
                    <span className="text-xs text-muted-foreground">
                      {settings.guidanceScale.toFixed(1)}
                    </span>
                  </div>
                  <Slider
                    value={[settings.guidanceScale]}
                    onValueChange={(value) =>
                      setSettings({ ...settings, guidanceScale: value[0] })
                    }
                    min={1}
                    max={20}
                    step={0.1}
                    className="py-2"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium">گام‌ها</label>
                    <span className="text-xs text-muted-foreground">
                      {settings.steps}
                    </span>
                  </div>
                  <Slider
                    value={[settings.steps]}
                    onValueChange={(value) =>
                      setSettings({ ...settings, steps: value[0] })
                    }
                    min={1}
                    max={150}
                    step={1}
                    className="py-2"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
