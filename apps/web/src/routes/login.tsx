import { useMutation } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { useSetAtom } from "jotai";
import { Eye, EyeOff, Loader2 } from "lucide-react";
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
import { getErrorMessage } from "@/lib/error-utils";
import { fa } from "@/lib/texts";
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
  const [showPassword, setShowPassword] = useState(false);
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

  const localError = getErrorMessage(
    loginMutation.error,
    fa.auth.loginForm.unknownError
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-4">
        <Card className="mx-auto w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">
              {fa.auth.loginForm.title}
            </CardTitle>
            <CardDescription className="text-gray-700 dark:text-gray-300">
              {fa.auth.loginForm.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label
                  className="font-medium text-gray-900 dark:text-gray-100"
                  htmlFor="username"
                >
                  {fa.auth.loginForm.usernameLabel}
                </Label>
                <Input
                  className="border-gray-300 bg-white text-gray-900 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
                  dir="ltr"
                  disabled={loginMutation.isPending}
                  id="username"
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={fa.auth.loginForm.usernamePlaceholder}
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
                  {fa.auth.loginForm.passwordLabel}
                </Label>
                <div className="relative">
                  <Input
                    className="border-gray-300 bg-white pr-12 text-gray-900 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
                    dir="ltr"
                    disabled={loginMutation.isPending}
                    id="password"
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={fa.auth.loginForm.passwordPlaceholder}
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                  />
                  <Button
                    aria-label={
                      showPassword
                        ? fa.auth.loginForm.hidePassword
                        : fa.auth.loginForm.showPassword
                    }
                    className="-translate-y-1/2 absolute top-1/2 right-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
                    disabled={loginMutation.isPending}
                    onClick={() => setShowPassword((prev) => !prev)}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {showPassword
                        ? fa.auth.loginForm.hidePassword
                        : fa.auth.loginForm.showPassword}
                    </span>
                  </Button>
                </div>
              </div>
              {loginMutation.error && (
                <Alert variant="destructive">
                  <AlertDescription>{localError}</AlertDescription>
                </Alert>
              )}
              <Button
                className="w-full bg-blue-600 font-medium text-white hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400"
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

        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-800 text-sm dark:text-gray-300">
                {fa.auth.loginForm.noAccount}
              </p>
              <Button asChild className="mt-2" variant="link">
                <Link
                  className="font-medium text-blue-700 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  to="/register"
                >
                  {fa.auth.registerForm.register}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
