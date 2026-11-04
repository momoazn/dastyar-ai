import { Copy, Loader2 } from "lucide-react";
import { EmptyHint, ToolPanel } from "@/components/tool-page/tool-page";
import { Badge, Button } from "@/components/ui";
import { fa } from "@/lib/texts";
import { detectTextDirection } from "@/lib/utils";

type TranslationResultProps = {
  translatedText: string;
  isTranslating: boolean;
  isCopied: boolean;
  onCopy: () => void;
};

export function TranslationResult({
  translatedText,
  isTranslating,
  isCopied,
  onCopy,
}: TranslationResultProps) {
  return (
    <ToolPanel
      actions={
        <>
          {translatedText && (
            <Button
              className={isCopied ? "bg-green-600 hover:bg-green-700" : ""}
              onClick={onCopy}
              size="sm"
              type="button"
              variant={isCopied ? "default" : "ghost"}
            >
              <Copy className="h-4 w-4" />
              {isCopied ? fa.chat.copied : fa.chat.copy}
            </Button>
          )}
          {isTranslating && (
            <Badge variant="secondary">
              <Loader2 className="h-3 w-3 animate-spin" />
              {fa.translation.translating}
            </Badge>
          )}
        </>
      }
      title={fa.translation.translatedText}
    >
      {translatedText ? (
        <div
          className="wrap-break-word whitespace-pre-wrap text-base"
          dir={detectTextDirection(translatedText)}
        >
          {translatedText}
        </div>
      ) : (
        <EmptyHint>{fa.translation.resultHint}</EmptyHint>
      )}
    </ToolPanel>
  );
}
