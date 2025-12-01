import { Copy, Loader2 } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import { fa } from "@/lib/persian-texts";

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
    <Card className="flex flex-col py-0 lg:order-2">
      <div className="border-b bg-muted/30 px-4 py-2.5">
        <div className="flex h-8 items-center justify-between">
          <span className="font-semibold text-foreground text-sm">
            {fa.translation.translatedText}
          </span>
          <div className="flex items-center gap-2">
            {translatedText && (
              <Button
                className={isCopied ? "bg-green-600 hover:bg-green-700" : ""}
                onClick={onCopy}
                size="sm"
                type="button"
                variant="outline"
              >
                <Copy className="mr-2 h-4 w-4" />
                {isCopied ? fa.chat.copied : fa.chat.copy}
              </Button>
            )}
            {isTranslating && (
              <Badge variant="secondary">
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                {fa.translation.translating}
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 p-4">
        {translatedText ? (
          <div className="h-full whitespace-pre-wrap break-words text-base">
            {translatedText}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <span className="text-sm">
              {fa.translation.translatedText} اینجا نمایش داده می‌شود...
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
