import type { KeyboardEvent } from "react";
import { Card, Textarea } from "@/components/ui";
import { fa } from "@/lib/persian-texts";
import { detectTextDirection } from "@/lib/utils";

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
  return (
    <Card className="flex flex-col py-0 lg:order-1">
      <div className="border-b bg-muted/30 px-4 py-2.5">
        <div className="flex h-8 items-center justify-between">
          <span className="font-semibold text-foreground text-sm">
            {fa.translation.sourceLanguage}
          </span>
        </div>
      </div>
      <div className="flex-1 p-4">
        <Textarea
          aria-label={fa.translation.enterText}
          className="h-full min-h-[300px] resize-none border-none p-0 text-base shadow-none focus-visible:ring-0"
          dir={sourceText ? detectTextDirection(sourceText) : "rtl"}
          disabled={isTranslating}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={fa.translation.enterText}
          value={sourceText}
        />
      </div>
    </Card>
  );
}
