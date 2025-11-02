import { Navigate, useRouterState } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import { tokenAtom } from "@/atoms/auth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useUser } from "@/hooks/use-user";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = useAtomValue(tokenAtom);
  const href = useRouterState({
    select: (s) => s.location.href,
  });
  const { isLoading } = useUser();

  if (!token) {
    const redirect = encodeURIComponent(href);
    return <Navigate to={`/login?redirect=${redirect}`} />;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <LoadingSpinner className="mx-auto mb-4 h-8 w-8" />
          <p className="text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return children;
}
