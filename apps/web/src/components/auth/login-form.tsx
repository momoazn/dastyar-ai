import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';

export function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, loginState } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ username, password });
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>ورود به سیستم</CardTitle>
        <CardDescription>
          نام کاربری و رمز عبور خود را وارد کنید
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="username">نام کاربری</Label>
            <Input
              disabled={loginState.isLoading}
              id="username"
              onChange={(e) => setUsername(e.target.value)}
              required
              type="text"
              value={username}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">رمز عبور</Label>
            <Input
              disabled={loginState.isLoading}
              id="password"
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
              value={password}
            />
          </div>
          {loginState.error && (
            <Alert variant="destructive">
              <AlertDescription>
                {loginState.error instanceof Error
                  ? loginState.error.message
                  : 'Login failed'}
              </AlertDescription>
            </Alert>
          )}
          <Button
            className="w-full"
            disabled={loginState.isLoading}
            type="submit"
          >
            {loginState.isLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            ورود
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
