import type { KeyboardEvent } from "react";
import { ToolPanel } from "@/components/tool-page/tool-page";
import { SurfaceStatus, Textarea } from "@/components/ui";
import { fa } from "@/lib/texts";
import { cn, detectTextDirection } from "@/lib/utils";

type TranslationTextInputProps = {
  sourceText: string;
  isTranslating: boolean;
  onTextChange: (text: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
};

export function TranslationTextInput({
  sourceText,
  isTranslating,
  onTextChange,
  onKeyDown,
}: TranslationTextInputProps) {
  const characterCount = sourceText.length;
  const isNearLimit = characterCount > 3500;

  return (
    <ToolPanel
      footer={
        <SurfaceStatus>
          <span
            className={cn(
              "font-medium text-xs",
              isNearLimit ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {characterCount.toLocaleString("fa-IR")} کاراکتر
          </span>
        </SurfaceStatus>
      }
      title={fa.translation.sourceLanguage}
    >
      <Textarea
        aria-label={fa.translation.sourceLanguage}
        className="min-h-[300px] flex-1 resize-none border-none bg-transparent p-0 text-base shadow-none focus-visible:ring-0"
        dir={sourceText ? detectTextDirection(sourceText) : "rtl"}
        disabled={isTranslating}
        onChange={(e) => onTextChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={fa.translation.enterText}
        value={sourceText}
      />
    </ToolPanel>
  );
}
