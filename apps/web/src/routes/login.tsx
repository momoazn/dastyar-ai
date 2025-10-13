import { useMutation } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { useSetAtom } from "jotai";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { tokenAtom } from "@/atoms/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthLayout from "@/layouts/auth";
import { fa } from "@/lib/persian-texts";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/login")({
  component: () => (
    <AuthLayout>
      <LoginPage />
    </AuthLayout>
  ),
});

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const setToken = useSetAtom(tokenAtom);
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" }) as { redirect?: string };

  const loginMutation = useMutation(
    orpc.auth.login.mutationOptions({
      onSuccess: (result) => {
        setToken(result.token);
        // Redirect to the intended page or home
        navigate({ to: search.redirect || "/" });
      },
    })
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-4">
        <Card className="mx-auto w-full max-w-md">
          <CardHeader>
            <CardTitle>{fa.auth.loginForm.title}</CardTitle>
            <CardDescription>{fa.auth.loginForm.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="username">
                  {fa.auth.loginForm.usernameLabel}
                </Label>
                <Input
                  disabled={loginMutation.isPending}
                  id="username"
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  type="text"
                  value={username}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  {fa.auth.loginForm.passwordLabel}
                </Label>
                <Input
                  disabled={loginMutation.isPending}
                  id="password"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </div>
              {loginMutation.error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {loginMutation.error instanceof Error
                      ? loginMutation.error.message
                      : fa.auth.loginForm.unknownError}
                  </AlertDescription>
                </Alert>
              )}
              <Button
                className="w-full"
                disabled={loginMutation.isPending}
                type="submit"
              >
                {loginMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {fa.auth.loginForm.login}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 text-sm dark:text-gray-400">
                {fa.auth.loginForm.noAccount}
              </p>
              <Button asChild className="mt-2" variant="link">
                <Link to="/register">{fa.auth.registerForm.register}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
