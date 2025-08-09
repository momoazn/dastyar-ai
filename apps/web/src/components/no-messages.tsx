import { BotIcon } from 'lucide-react';
import { PERSIAN_TEXTS } from '@/lib/persian-texts';
import { cn } from '@/lib/utils';

export function NoMessages({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex min-h-[50vh] w-full flex-1 items-center justify-center md:min-h-[60vh]',
        className
      )}
    >
      <div className="text-center">
        <BotIcon className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted p-4 text-muted-foreground" />
        <h3 className="mb-2 font-semibold text-foreground text-lg">
          {PERSIAN_TEXTS.chat.askQuestion}
        </h3>
        <p className="text-muted-foreground text-sm">
          {PERSIAN_TEXTS.chat.askQuestionDescription}
        </p>
      </div>
    </div>
  );
}
