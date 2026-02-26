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

  const registerMutation = useMutation(
    orpc.auth.register.mutationOptions({
      onSuccess: (result) => {
        setToken(result.token);
        if (result.user.role === "admin") {
          setShowAdminDialog(true);
        } else {
          // Redirect to the intended page or home
          navigate({ to: search.redirect || "/" });
        }
      },
    })
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    const trimmedUsername = username.trim();

    if (!/^\d{10}$/.test(trimmedUsername)) {
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
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Card className="mx-auto w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">
              {fa.auth.registerForm.title}
            </CardTitle>
            <CardDescription className="text-gray-700 dark:text-gray-300">
              {fa.auth.registerForm.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label
                  className="font-medium text-gray-900 dark:text-gray-100"
                  htmlFor="username"
                >
                  {fa.auth.registerForm.usernameLabel}
                </Label>
                <Input
                  autoComplete="username"
                  className="border-gray-300 bg-white text-gray-900 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
                  dir="ltr"
                  disabled={registerMutation.isPending}
                  id="username"
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (localError) {
                      setLocalError("");
                    }
                  }}
                  inputMode="numeric"
                  maxLength={10}
                  minLength={10}
                  pattern="\\d{10}"
                  placeholder={fa.auth.registerForm.usernamePlaceholder}
                  required
                  type="text"
                  value={username}
                />
              </div>
              <div className="space-y-2">
                <Label
                  className="font-medium text-gray-900 dark:text-gray-100"
                  htmlFor="password"
                >
                  {fa.auth.registerForm.passwordLabel}
                </Label>
                <PasswordInput
                  className="border-gray-300 bg-white text-gray-900 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
                  dir="ltr"
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
                <Label
                  className="font-medium text-gray-900 dark:text-gray-100"
                  htmlFor="confirmPassword"
                >
                  {fa.auth.registerForm.confirmPasswordLabel}
                </Label>
                <PasswordInput
                  className="border-gray-300 bg-white text-gray-900 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
                  dir="ltr"
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
                className="w-full bg-blue-600 font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                disabled={registerMutation.isPending}
                type="submit"
              >
                {registerMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {fa.auth.registerForm.register}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-800 text-sm dark:text-gray-300">
                {fa.auth.registerForm.alreadyRegistered}
              </p>
              <Button asChild className="mt-2" variant="link">
                <Link
                  className="font-medium text-blue-700 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  to="/login"
                >
                  {fa.auth.loginForm.login}
                </Link>
              </Button>
            </div>
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
              onClick={() => navigate({ to: search.redirect || "/" })}
            >
              {fa.admin.users.actions.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
