import { fa } from "@/lib/persian-texts";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
};

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
    description={fa.navigation.emptyStates.chat.description}
    title={fa.navigation.noChatThreads}
  />
);

export const TranslationEmptyState = () => (
  <EmptyState
    description={fa.navigation.emptyStates.translation.description}
    title={fa.navigation.emptyStates.translation.title}
  />
);

export const SummaryEmptyState = () => (
  <EmptyState
    description={fa.navigation.emptyStates.summary.description}
    title={fa.navigation.emptyStates.summary.title}
  />
);

export const ImageEmptyState = () => (
  <EmptyState
    description={fa.navigation.emptyStates.image.description}
    title={fa.navigation.emptyStates.image.title}
  />
);

export const TranscribeEmptyState = () => (
  <EmptyState
    description={fa.navigation.emptyStates.transcribe.description}
    title={fa.navigation.emptyStates.transcribe.title}
  />
);
