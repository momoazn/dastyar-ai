import type { KeyboardEvent } from "react";
import {
  Surface,
  SurfaceContent,
  SurfaceHeader,
  SurfaceStatus,
  SurfaceTitle,
  Textarea,
} from "@/components/ui";
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
    <Surface className="flex flex-col py-0 lg:order-1" padded={false}>
      <SurfaceHeader className="border-b bg-muted/40">
        <SurfaceTitle>{fa.translation.sourceLanguage}</SurfaceTitle>
      </SurfaceHeader>
      <SurfaceContent className="flex-1">
        <Textarea
          aria-label={fa.translation.enterText}
          className="h-full min-h-[260px] resize-none border-none bg-transparent p-0 text-base shadow-none focus-visible:ring-0"
          dir={sourceText ? detectTextDirection(sourceText) : "rtl"}
          disabled={isTranslating}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={fa.translation.enterText}
          value={sourceText}
        />
      </SurfaceContent>
      <SurfaceStatus className="justify-between">
        <span className="text-muted-foreground text-xs">
          {fa.translation.enterText}
        </span>
        <span
          className={cn(
            "font-medium text-xs",
            isNearLimit ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {characterCount.toLocaleString("fa-IR")} کاراکتر
        </span>
      </SurfaceStatus>
    </Surface>
  );
}
