import { fa } from "@/lib/persian-texts";

type SidebarLoadingStateProps = {
  message?: string;
};

export function SidebarLoadingState({
  message = fa.navigation.loadingThreads,
}: SidebarLoadingStateProps) {
  return (
    <div className="mt-4 flex h-full items-center justify-center">
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}
