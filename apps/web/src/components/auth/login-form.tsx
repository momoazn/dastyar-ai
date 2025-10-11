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

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const setToken = useSetAtom(tokenAtom);
  const setUser = useSetAtom(userAtom);
  const setIsLoading = useSetAtom(isLoadingAtom);

  const loginMutation = useMutation(
    orpc.auth.login.mutationOptions({
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
    loginMutation.mutate({ username, password });
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>{fa.auth.loginForm.title}</CardTitle>
        <CardDescription>{fa.auth.loginForm.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="username">{fa.auth.loginForm.usernameLabel}</Label>
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
            <Label htmlFor="password">{fa.auth.loginForm.passwordLabel}</Label>
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
  );
}
