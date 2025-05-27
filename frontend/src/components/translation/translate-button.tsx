import { Button } from "@/components/ui";
import { SendIcon } from "lucide-react";

interface TranslateButtonProps {
  onTranslate: () => void;
  isTranslating: boolean;
  text: string;
  disabled?: boolean;
}

export function TranslateButton({
  onTranslate,
  isTranslating,
  text,
  disabled = false,
}: TranslateButtonProps) {
  return (
    <div className="flex flex-1/5 justify-end">
      <Button
        variant="outline"
        size="lg"
        className="cursor-pointer"
        onClick={onTranslate}
        disabled={disabled || isTranslating}
      >
        <span className="text-sm">{text}</span>
        <SendIcon className="size-4" />
      </Button>
    </div>
  );
} 