import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/hooks/use-auth';
import { LoginForm } from './login-form';
import { RegisterForm } from './register-form';

type AuthMode = 'login' | 'register';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
        <div className="w-full max-w-md space-y-4">
          {mode === 'login' ? <LoginForm /> : <RegisterForm />}

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-600 text-sm dark:text-gray-400">
                  {mode === 'login'
                    ? 'حساب کاربری ندارید؟'
                    : 'قبلاً ثبت نام کرده‌اید؟'}
                </p>
                <Button
                  className="mt-2"
                  onClick={() =>
                    setMode(mode === 'login' ? 'register' : 'login')
                  }
                  variant="link"
                >
                  {mode === 'login' ? 'ثبت نام' : 'ورود'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
