import { fa } from '@/lib/persian-texts';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="p-4 text-center text-sidebar-foreground/60">
      {icon && <div className="mb-2">{icon}</div>}
      <div className="text-sm">{title}</div>
      {description && (
        <div className="mt-1 text-sidebar-foreground/40 text-xs">
          {description}
        </div>
      )}
    </div>
  );
}

// Pre-configured empty states for different features
export const ChatEmptyState = () => (
  <EmptyState
    title={fa.navigation.noChatThreads}
    description="با کلیک روی دکمه + گفتگوی جدید ایجاد کنید"
  />
);

export const TranslationEmptyState = () => (
  <EmptyState
    title="هنوز ترجمه‌ای ایجاد نشده است"
    description="با استفاده از فرم سمت راست، ترجمه جدید ایجاد کنید"
  />
);

export const SummaryEmptyState = () => (
  <EmptyState
    title="هنوز خلاصه‌ای ایجاد نشده است"
    description="با استفاده از فرم سمت راست، خلاصه جدید ایجاد کنید"
  />
);

export const ImageEmptyState = () => (
  <EmptyState
    title="هنوز تصویری تولید نشده است"
    description="با استفاده از فرم سمت راست، تصویر جدید ایجاد کنید"
  />
);

export const TranscribeEmptyState = () => (
  <EmptyState
    title="هنوز فایل صوتی‌ای تبدیل نشده است"
    description="با استفاده از فرم سمت راست، فایل صوتی جدید آپلود کنید"
  />
);