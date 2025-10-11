import { useMutation } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { isLoadingAtom, tokenAtom, userAtom } from "@/atoms/auth";
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
import { fa } from "@/lib/persian-texts";
import { orpc } from "@/utils/orpc";

const MIN_PASSWORD_LENGTH = 6;

export function RegisterForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const setToken = useSetAtom(tokenAtom);
  const setUser = useSetAtom(userAtom);
  const setIsLoading = useSetAtom(isLoadingAtom);

  const registerMutation = useMutation(
    orpc.auth.register.mutationOptions({
      onSuccess: (result) => {
        setToken(result.token);
        setUser(result.user);
        setIsLoading(false);
      },
      onError: () => {
        setIsLoading(false);
      },
    })
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (password !== confirmPassword) {
      setLocalError(fa.auth.registerForm.passwordMismatch);
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setLocalError(fa.auth.registerForm.passwordTooShort);
      return;
    }

    registerMutation.mutate({ username, password });
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>{fa.auth.registerForm.title}</CardTitle>
        <CardDescription>{fa.auth.registerForm.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="username">
              {fa.auth.registerForm.usernameLabel}
            </Label>
            <Input
              disabled={registerMutation.isPending}
              id="username"
              onChange={(e) => setUsername(e.target.value)}
              required
              type="text"
              value={username}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">
              {fa.auth.registerForm.passwordLabel}
            </Label>
            <Input
              disabled={registerMutation.isPending}
              id="password"
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
              value={password}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              {fa.auth.registerForm.confirmPasswordLabel}
            </Label>
            <Input
              disabled={registerMutation.isPending}
              id="confirmPassword"
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              type="password"
              value={confirmPassword}
            />
          </div>
          {(localError || registerMutation.error) && (
            <Alert variant="destructive">
              <AlertDescription>
                {localError ||
                  (registerMutation.error instanceof Error
                    ? registerMutation.error.message
                    : fa.auth.registerForm.unknownError)}
              </AlertDescription>
            </Alert>
          )}
          <Button
            className="w-full"
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
  );
}
