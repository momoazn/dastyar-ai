import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui';

// Placeholder until translations backend wired
export function TranslationsList() {
  const translations: Array<{ id: string; sourceText: string }> = [];

  return (
    <>
      {translations.map((t) => (
        <Link
          className="relative flex h-12 items-center justify-between border-b p-4 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          key={t.id}
          search={{ id: t.id as string } as any}
          to="/translation"
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <div className="absolute top-0 right-0 h-full w-1 bg-blue-500" />
              )}
              <span className="font-medium">
                {t.sourceText?.slice(0, 30) || 'بدون عنوان'}
              </span>
              <div className="flex items-center gap-0">
                <Button
                  className="cursor-pointer hover:text-red-500"
                  size="icon"
                  variant="ghost"
                >
                  حذف
                </Button>
              </div>
            </>
          )}
        </Link>
      ))}
    </>
  );
}
