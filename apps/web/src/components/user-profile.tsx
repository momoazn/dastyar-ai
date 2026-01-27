import { useAtom } from "jotai";
import { LogOut } from "lucide-react";
import { logoutAtom, tokenAtom } from "@/atoms/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/hooks/use-user";
import { fa } from "@/lib/texts";

function getRoleInPersian(role: string): string {
  return (
    fa.userProfile.roles[role as keyof typeof fa.userProfile.roles] || role
  );
}

export function UserProfile() {
  const [token] = useAtom(tokenAtom);
  const [, logout] = useAtom(logoutAtom);
  const { data: user, isLoading, error } = useUser();

  if (!token) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="cursor-pointer">
        <CardHeader>
          <CardTitle>{fa.userProfile.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="mb-2 h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="cursor-pointer">
        <CardHeader>
          <CardTitle>{fa.userProfile.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{fa.userProfile.failedToLoad}</p>
          <Button className="mt-2" onClick={logout} size="sm" variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            {fa.userProfile.logOut}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="cursor-pointer">
      <CardHeader>
        <CardTitle>{fa.userProfile.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p>
            <strong>{fa.userProfile.username}:</strong> {user?.username}
          </p>
          <p>
            <strong>{fa.userProfile.role}:</strong>{" "}
            {getRoleInPersian(user?.role || "")}
          </p>
          <p>
            <strong>{fa.userProfile.id}:</strong> {user?.id}
          </p>
        </div>
        <Button className="mt-4" onClick={logout} size="sm" variant="outline">
          <LogOut className="mr-2 h-4 w-4" />
          {fa.userProfile.logOut}
        </Button>
      </CardContent>
    </Card>
  );
}
