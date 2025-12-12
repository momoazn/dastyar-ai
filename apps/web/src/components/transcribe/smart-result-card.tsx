import { CopyIcon, Sparkles } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { fa } from "@/lib/persian-texts";

type SmartResultCardProps = {
  title: string | null;
  result: string | null;
  isLoading: boolean;
  onCopy: (text: string) => void;
};

export function SmartResultCard({
  title,
  result,
  isLoading,
  onCopy,
}: SmartResultCardProps) {
  if (!(result || isLoading)) {
    return null;
  }

  return (
    <Card className="fade-in slide-in-from-bottom-4 w-full animate-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <CardTitle>{title}</CardTitle>
          </div>
          {result && (
            <Button onClick={() => onCopy(result)} size="sm" variant="ghost">
              <CopyIcon className="mr-2 size-4" />
              {fa.transcribe.copy}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <LoadingSpinner className="mb-4 size-8" />
            <p>{fa.transcribe.smartActions.processing}</p>
          </div>
        ) : (
          <div
            className="prose prose-sm dark:prose-invert max-w-none rounded-md bg-muted/50 p-4 rtl:text-right"
            dir="rtl"
          >
            <pre className="whitespace-pre-wrap font-sans">{result}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
