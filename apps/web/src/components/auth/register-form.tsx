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

export function RegisterForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const { register, registerState } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (password !== confirmPassword) {
      setLocalError('رمز عبور و تکرار آن مطابقت ندارند');
      return;
    }

    if (password.length < 6) {
      setLocalError('رمز عبور باید حداقل ۶ کاراکتر باشد');
      return;
    }

    register({ username, password });
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>ایجاد حساب کاربری</CardTitle>
        <CardDescription>
          نام کاربری و رمز عبور خود را انتخاب کنید
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="username">نام کاربری</Label>
            <Input
              disabled={registerState.isLoading}
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
              disabled={registerState.isLoading}
              id="password"
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
              value={password}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">تکرار رمز عبور</Label>
            <Input
              disabled={registerState.isLoading}
              id="confirmPassword"
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              type="password"
              value={confirmPassword}
            />
          </div>
          {(localError || registerState.error) && (
            <Alert variant="destructive">
              <AlertDescription>
                {localError ||
                  (registerState.error instanceof Error
                    ? registerState.error.message
                    : 'Registration failed')}
              </AlertDescription>
            </Alert>
          )}
          <Button
            className="w-full"
            disabled={registerState.isLoading}
            type="submit"
          >
            {registerState.isLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            ثبت نام
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
