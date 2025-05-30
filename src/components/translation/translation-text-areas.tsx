import { Card, Textarea } from "@/components/ui";

interface TranslationTextAreasProps {
  sourceText: string;
  translatedText: string;
  isTranslating: boolean;
  onSourceTextChange: (value: string) => void;
  placeholders: {
    enterText: string;
    translatedText: string;
  };
  loadingText: string;
}

export function TranslationTextAreas({
  sourceText,
  translatedText,
  isTranslating,
  onSourceTextChange,
  placeholders,
  loadingText,
}: TranslationTextAreasProps) {
  return (
    <div className="flex h-full w-full flex-col gap-4">
      {/* Input text area */}
      <Card className="flex-2/5 p-4">
        <div className="h-full">
          <Textarea
            placeholder={placeholders.enterText}
            value={sourceText}
            onChange={(e) => onSourceTextChange(e.target.value)}
            className="h-full min-h-[200px] resize-none border-none p-2 text-base shadow-none focus-visible:ring-0"
          />
        </div>
      </Card>

      {/* Translated text area */}
      <Card className="flex-2/5 p-4">
        <div className="h-full">
          {isTranslating ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-muted-foreground">{loadingText}...</div>
            </div>
          ) : (
            <Textarea
              placeholder={placeholders.translatedText}
              value={translatedText}
              readOnly
              className="h-full min-h-[200px] resize-none border-none p-2 text-base shadow-none focus-visible:ring-0"
            />
          )}
        </div>
      </Card>
    </div>
  );
}
