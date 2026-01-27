import { AlertTriangle, RefreshCw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { formatErrorForUser } from "@/lib/error-utils";
import { logger } from "@/lib/logger";
import { fa } from "@/lib/texts";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

/**
 * Error Boundary component for catching React errors
 * Provides fallback UI and error logging
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: unknown): State {
    // Normalize error to Error instance
    const normalizedError =
      error instanceof Error
        ? error
        : new Error(String(error ?? "Unknown error"));
    return { hasError: true, error: normalizedError };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    // Normalize error to Error instance for logging
    const normalizedError =
      error instanceof Error
        ? error
        : new Error(String(error ?? "Unknown error"));
    // Log error to error reporting service
    logger.error("Error caught by boundary", normalizedError, {
      componentStack: errorInfo.componentStack,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Reload the page to reset the app state
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md p-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>

              <div className="space-y-2">
                <h2 className="font-semibold text-xl">
                  {fa.errors.unexpected}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {this.state.error
                    ? formatErrorForUser(this.state.error, fa.errors.unknown, {
                        unknown: fa.errors.unknown,
                        networkError: fa.errors.networkError,
                        unauthorized: fa.errors.unauthorized,
                        forbidden: fa.errors.forbidden,
                        notFound: fa.errors.notFound,
                        serverError: fa.errors.serverError,
                      })
                    : fa.errors.unexpectedMessage}
                </p>
              </div>

              {this.state.error && import.meta.env.DEV && (
                <div className="w-full rounded-md bg-muted p-3 text-left">
                  <p className="font-mono text-destructive text-xs">
                    {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <pre className="mt-2 overflow-auto text-xs">
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={this.handleReset} size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {fa.errors.resetPage}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
