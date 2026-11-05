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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

const MIN_PASSWORD_LENGTH = 6;
const NATIONAL_CODE_NUMERIC_REGEX = /^\d+$/;
const NATIONAL_CODE_LENGTH_REGEX = /^\d{10}$/;

export const Route = createFileRoute("/register")({
  component: () => (
    <AuthLayout>
      <RegisterPage />
    </AuthLayout>
  ),
});

function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const setToken = useSetAtom(tokenAtom);
  const navigate = useNavigate();
  const search = useSearch({ from: "/register" }) as { redirect?: string };
  const appHome = useEnabledNavItems()[0]?.url ?? "/chat/";

  const registerMutation = useMutation(
    orpc.auth.register.mutationOptions({
      onSuccess: (result) => {
        setToken(result.token);
        if (result.user.role === "admin") {
          setShowAdminDialog(true);
        } else {
          // Redirect to the intended page or home
          navigate({ to: search.redirect || appHome });
        }
      },
    })
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    const trimmedUsername = username.trim();

    if (!NATIONAL_CODE_NUMERIC_REGEX.test(trimmedUsername)) {
      setLocalError(fa.auth.registerForm.nationalCodeNotNumeric);
      return;
    }
    if (!NATIONAL_CODE_LENGTH_REGEX.test(trimmedUsername)) {
      setLocalError(fa.auth.registerForm.nationalCodeInvalid);
      return;
    }

    if (password !== confirmPassword) {
      setLocalError(fa.auth.registerForm.passwordMismatch);
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setLocalError(fa.auth.registerForm.passwordTooShort);
      return;
    }

    registerMutation.mutate({ username: trimmedUsername, password });
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
            <CardTitle className="text-xl">
              {fa.auth.registerForm.title}
            </CardTitle>
            <CardDescription>
              {fa.auth.registerForm.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="username">
                  {fa.auth.registerForm.usernameLabel}
                </Label>
                <Input
                  autoComplete="username"
                  disabled={registerMutation.isPending}
                  id="username"
                  inputMode="numeric"
                  maxLength={10}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (localError) {
                      setLocalError("");
                    }
                  }}
                  placeholder={fa.auth.registerForm.usernamePlaceholder}
                  required
                  type="text"
                  value={username}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  {fa.auth.registerForm.passwordLabel}
                </Label>
                <PasswordInput
                  disabled={registerMutation.isPending}
                  hidePasswordAriaLabel={fa.auth.loginForm.hidePassword}
                  id="password"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={fa.auth.registerForm.passwordPlaceholder}
                  required
                  showPasswordAriaLabel={fa.auth.loginForm.showPassword}
                  value={password}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  {fa.auth.registerForm.confirmPasswordLabel}
                </Label>
                <PasswordInput
                  disabled={registerMutation.isPending}
                  hidePasswordAriaLabel={fa.auth.loginForm.hidePassword}
                  id="confirmPassword"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={fa.auth.registerForm.confirmPasswordPlaceholder}
                  required
                  showPasswordAriaLabel={fa.auth.loginForm.showPassword}
                  value={confirmPassword}
                />
              </div>
              {(localError || registerMutation.error) && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {localError ||
                      getErrorMessage(
                        registerMutation.error,
                        fa.auth.registerForm.unknownError
                      )}
                  </AlertDescription>
                </Alert>
              )}
              <Button
                className="w-full"
                disabled={registerMutation.isPending}
                type="submit"
              >
                {registerMutation.isPending && (
                  <Loader2
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin"
                  />
                )}
                {fa.auth.registerForm.register}
              </Button>
            </form>
            <p className="mt-6 text-center text-muted-foreground text-sm">
              {fa.auth.registerForm.alreadyRegistered}{" "}
              <Link
                className="font-medium text-primary underline-offset-4 hover:underline"
                to="/login"
              >
                {fa.auth.loginForm.login}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      <AlertDialog onOpenChange={setShowAdminDialog} open={showAdminDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{fa.general.success}</AlertDialogTitle>
            <AlertDialogDescription>
              {fa.auth.registerForm.firstUserAdmin}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => navigate({ to: search.redirect || appHome })}
            >
              {fa.admin.users.actions.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
