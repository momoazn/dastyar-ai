import { Navigate } from "@tanstack/react-router";
import { useAtomValue, useSetAtom } from "jotai";
import { ArrowRight, LogOut } from "lucide-react";
import { logoutAtom, tokenAtom } from "@/atoms/auth";
import { Button, Card } from "@/components/ui";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useUser } from "@/hooks/use-user";
import { fa } from "@/lib/persian-texts";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: user, isLoading, error } = useUser();
  const token = useAtomValue(tokenAtom);
  const logout = useSetAtom(logoutAtom);

  // Show loading while checking user
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

  // Redirect to home if not authenticated
  if (!token) {
    return <Navigate to="/" />;
  }

  // If there's an error or no user data, redirect to home
  if (error || !user) {
    return <Navigate to="/" />;
  }

  // Redirect to home if not admin
  if (user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="mx-auto max-w-md p-8 text-center">
          <div className="mb-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <LogOut className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="mb-2 font-bold text-2xl text-destructive">
              {fa.admin.accessDenied}
            </h1>
            <p className="text-muted-foreground">
              {fa.admin.accessDeniedMessage}
            </p>
          </div>
          <Button asChild>
            <a href="/">{fa.admin.navigation.backToApp}</a>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button asChild size="sm" variant="ghost">
                <a className="flex items-center gap-2" href="/">
                  <ArrowRight className="h-4 w-4" />
                  {fa.admin.navigation.backToApp}
                </a>
              </Button>
              <div className="text-right">
                <h1 className="font-bold text-2xl">{fa.admin.title}</h1>
                <p className="text-muted-foreground text-sm">
                  {fa.admin.subtitle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-muted-foreground text-sm">
                {user.username} ({user.role === "admin" ? "مدیر" : "کاربر"})
              </div>
              <Button
                className="flex items-center gap-2"
                onClick={() => logout()}
                size="sm"
                type="button"
                variant="outline"
              >
                <LogOut className="h-4 w-4" />
                {fa.admin.navigation.logout}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
