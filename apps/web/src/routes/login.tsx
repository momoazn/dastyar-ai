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
import { useEnabledNavItems } from "@/components/sidebar/use-enabled-nav-items";
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
import { PasswordInput } from "@/components/ui/password-input";
import AuthLayout from "@/layouts/auth";
import { getErrorMessage } from "@/lib/error-utils";
import { fa } from "@/lib/texts";
import { orpc } from "@/utils/orpc";

const NATIONAL_CODE_NUMERIC_REGEX = /^\d+$/;
const NATIONAL_CODE_LENGTH_REGEX = /^\d{10}$/;

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
  const [localError, setLocalError] = useState("");
  const setToken = useSetAtom(tokenAtom);
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" }) as { redirect?: string };
  const appHome = useEnabledNavItems()[0]?.url ?? "/chat/";

  const loginMutation = useMutation(
    orpc.auth.login.mutationOptions({
      onSuccess: (result) => {
        setToken(result.token);
        navigate({ to: search.redirect || appHome });
      },
    })
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    if (!NATIONAL_CODE_NUMERIC_REGEX.test(trimmedUsername)) {
      setLocalError(fa.auth.loginForm.nationalCodeNotNumeric);
      return;
    }
    if (!NATIONAL_CODE_LENGTH_REGEX.test(trimmedUsername)) {
      setLocalError(fa.auth.loginForm.nationalCodeInvalid);
      return;
    }
    setLocalError("");
    loginMutation.mutate({ username: trimmedUsername, password });
  };

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="mx-auto w-full max-w-md shadow-sm">
          <CardHeader className="items-center text-center">
            <img
              alt=""
              className="mx-auto mb-2 size-12 rounded-xl"
              height={48}
              src="/brand-logo.svg"
              width={48}
            />
            <CardTitle className="text-xl">{fa.auth.loginForm.title}</CardTitle>
            <CardDescription>{fa.auth.loginForm.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="username">
                  {fa.auth.loginForm.usernameLabel}
                </Label>
                <Input
                  autoComplete="username"
                  disabled={loginMutation.isPending}
                  id="username"
                  inputMode="numeric"
                  maxLength={10}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (localError) {
                      setLocalError("");
                    }
                  }}
                  placeholder={fa.auth.loginForm.usernamePlaceholder}
                  required
                  type="text"
                  value={username}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  {fa.auth.loginForm.passwordLabel}
                </Label>
                <PasswordInput
                  disabled={loginMutation.isPending}
                  hidePasswordAriaLabel={fa.auth.loginForm.hidePassword}
                  id="password"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={fa.auth.loginForm.passwordPlaceholder}
                  required
                  showPasswordAriaLabel={fa.auth.loginForm.showPassword}
                  value={password}
                />
              </div>
              {(localError || loginMutation.error) && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {localError ||
                      getErrorMessage(
                        loginMutation.error,
                        fa.auth.loginForm.unknownError
                      )}
                  </AlertDescription>
                </Alert>
              )}
              <Button
                className="w-full"
                disabled={loginMutation.isPending}
                type="submit"
              >
                {loginMutation.isPending && (
                  <Loader2
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin"
                  />
                )}
                {fa.auth.loginForm.login}
              </Button>
            </form>
            <p className="mt-6 text-center text-muted-foreground text-sm">
              {fa.auth.loginForm.noAccount}{" "}
              <Link
                className="font-medium text-primary underline-offset-4 hover:underline"
                to="/register"
              >
                {fa.auth.registerForm.register}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
