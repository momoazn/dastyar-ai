import { Navigate } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import { ShieldAlert } from "lucide-react";
import { tokenAtom } from "@/atoms/auth";
import { Button } from "@/components/ui";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useUser } from "@/hooks/use-user";
import { fa } from "@/lib/texts";

/** Renders children for admins only. The app shell already supplies header and sidebar. */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, error } = useUser();
  const token = useAtomValue(tokenAtom);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="text-center">
          <LoadingSpinner className="mx-auto mb-4 h-8 w-8" />
          <p className="text-muted-foreground">{fa.general.loading}</p>
        </div>
      </div>
    );
  }

  if (!token || error || !user) {
    return <Navigate to="/" />;
  }

  if (user.role !== "admin") {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center"
        dir="rtl"
      >
        <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
          <ShieldAlert className="size-7 text-destructive" />
        </div>
        <h1 className="font-bold text-destructive text-xl">
          {fa.admin.accessDenied}
        </h1>
        <p className="text-muted-foreground text-sm">
          {fa.admin.accessDeniedMessage}
        </p>
        <Button asChild>
          <a href="/">{fa.admin.navigation.backToApp}</a>
        </Button>
      </div>
    );
  }

  return children;
}
