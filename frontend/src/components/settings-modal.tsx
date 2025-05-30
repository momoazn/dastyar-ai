import { ChevronDown, ChevronUp, Settings } from "lucide-react";
import { useState } from "react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Textarea,
} from "@/components/ui";
import {
  useChatSettings,
  useModelsList,
} from "@/hooks";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import {
  useGetDefaultChatModel,
  useGetDefaultTranslationModel,
  useSetDefaultChatModel,
  useSetDefaultTranslationModel,
} from "@/atoms";

export function SettingsModal() {
  const { data: aiModels } = useModelsList();

  const defaultChatModel = useGetDefaultChatModel();
  const defaultTranslationModel = useGetDefaultTranslationModel();
  const setDefaultChatModel = useSetDefaultChatModel();
  const setDefaultTranslationModel = useSetDefaultTranslationModel();

  const {
    settings: chatSettings,
    updateSettings: updateChatSettings,
    resetSettings: resetChatSettings,
  } = useChatSettings();
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-12 w-12">
          <Settings className="h-12 w-12" />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="scrollbar-none max-h-[90vh] overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle className="text-right">
            {PERSIAN_TEXTS.settings.title}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="space-y-4">
            <h3 className="text-muted-foreground text-right text-sm font-medium">
              {PERSIAN_TEXTS.modelSelection.aiModels}
            </h3>
            <div className="flex flex-col gap-2">
              <div className="space-y-1">
                <label className="block text-right text-xs font-medium">
                  {PERSIAN_TEXTS.modelSelection.chatModel}
                </label>
                <Select
                  value={defaultChatModel || ""}
                  onValueChange={setDefaultChatModel}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        PERSIAN_TEXTS.modelSelection.selectChatModel
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {aiModels
                      ?.filter((model) => model.name)
                      .map((model) => (
                        <SelectItem key={model.name} value={model.name!}>
                          {model.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="block text-right text-xs font-medium">
                  {PERSIAN_TEXTS.modelSelection.translationModel}
                </label>
                <Select
                  value={defaultTranslationModel || ""}
                  onValueChange={setDefaultTranslationModel}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        PERSIAN_TEXTS.modelSelection.selectTranslationModel
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {aiModels
                      ?.filter((model) => model.name)
                      .map((model) => (
                        <SelectItem key={model.name} value={model.name!}>
                          {model.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="rtl flex items-center justify-between">
                <h3 className="text-muted-foreground text-sm font-medium">
                  {PERSIAN_TEXTS.settings.chatTab}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetChatSettings}
                  className="h-8 text-xs"
                >
                  {PERSIAN_TEXTS.settings.reset}
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full"
              >
                {showAdvanced ? (
                  <>
                    <ChevronUp className="ml-2 h-4 w-4" />
                    {PERSIAN_TEXTS.settings.hideAdvanced}
                  </>
                ) : (
                  <>
                    <ChevronDown className="ml-2 h-4 w-4" />
                    {PERSIAN_TEXTS.settings.showAdvanced}
                  </>
                )}
              </Button>

              <div
                className={`grid overflow-hidden transition-all duration-500 ease-in-out ${
                  showAdvanced
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="space-y-4 rounded-lg py-4">
                    <div className="space-y-1">
                      <label className="block text-right text-xs font-medium">
                        {PERSIAN_TEXTS.settings.baseUrl}
                      </label>
                      <Input
                        value={chatSettings.baseUrl}
                        onChange={(e) =>
                          updateChatSettings({ baseUrl: e.target.value })
                        }
                        className="text-left"
                        dir="ltr"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-right text-xs font-medium">
                        {PERSIAN_TEXTS.settings.systemPrompt}
                      </label>
                      <Textarea
                        value={chatSettings.systemPrompt}
                        onChange={(e) =>
                          updateChatSettings({ systemPrompt: e.target.value })
                        }
                        className="min-h-[150px] text-left"
                        dir="ltr"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-row-reverse items-center justify-between">
                        <label className="text-xs font-medium">
                          {PERSIAN_TEXTS.settings.temperature}
                        </label>
                        <span className="text-muted-foreground text-xs">
                          {chatSettings.temperature.toFixed(1)}
                        </span>
                      </div>
                      <Slider
                        value={[chatSettings.temperature]}
                        onValueChange={([value]) =>
                          updateChatSettings({ temperature: value })
                        }
                        min={0}
                        max={2}
                        step={0.1}
                        className="py-2"
                        dir="ltr"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-row-reverse items-center justify-between">
                        <label className="text-xs font-medium">
                          {PERSIAN_TEXTS.settings.topP}
                        </label>
                        <span className="text-muted-foreground text-xs">
                          {chatSettings.topP.toFixed(1)}
                        </span>
                      </div>
                      <Slider
                        value={[chatSettings.topP]}
                        onValueChange={([value]) =>
                          updateChatSettings({ topP: value })
                        }
                        min={0}
                        max={1}
                        step={0.1}
                        className="py-2"
                        dir="ltr"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-row-reverse items-center justify-between">
                        <label className="text-xs font-medium">
                          {PERSIAN_TEXTS.settings.presencePenalty}
                        </label>
                        <span className="text-muted-foreground text-xs">
                          {chatSettings.presencePenalty.toFixed(1)}
                        </span>
                      </div>
                      <Slider
                        value={[chatSettings.presencePenalty]}
                        onValueChange={([value]) =>
                          updateChatSettings({ presencePenalty: value })
                        }
                        min={-2}
                        max={2}
                        step={0.1}
                        className="py-2"
                        dir="ltr"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-row-reverse items-center justify-between">
                        <label className="text-xs font-medium">
                          {PERSIAN_TEXTS.settings.frequencyPenalty}
                        </label>
                        <span className="text-muted-foreground text-xs">
                          {chatSettings.frequencyPenalty.toFixed(1)}
                        </span>
                      </div>
                      <Slider
                        value={[chatSettings.frequencyPenalty]}
                        onValueChange={([value]) =>
                          updateChatSettings({ frequencyPenalty: value })
                        }
                        min={-2}
                        max={2}
                        step={0.1}
                        className="py-2"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
