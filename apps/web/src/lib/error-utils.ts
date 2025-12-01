/**
 * Extract error message from unknown error type
 * Handles Error instances, string errors, and other types
 */
export function getErrorMessage(error: unknown, fallback?: string): string {
  const defaultFallback = "خطای ناشناخته";
  const finalFallback: string = fallback ?? defaultFallback;
  if (error instanceof Error) {
    return error.message || finalFallback;
  }
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
  }
  return finalFallback;
}

/**
 * Check if error is an Error instance
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Extract error code from error object if available
 */
export function getErrorCode(error: unknown): string | undefined {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }
}

/**
 * Check if error is a network-related error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes("network") ||
      error.message.includes("fetch") ||
      error.message.includes("timeout") ||
      error.name === "NetworkError" ||
      error.name === "TypeError"
    );
  }
  return false;
}

/**
 * Format error message for user display
 * Provides user-friendly error messages
 *
 * @param error - The error to format
 * @param fallback - Optional fallback message (defaults to unknown error)
 * @param errorTexts - Optional error text constants (imports from texts if not provided)
 */
export function formatErrorForUser(
  error: unknown,
  fallback?: string,
  errorTexts?: {
    unknown: string;
    networkError: string;
    unauthorized: string;
    forbidden: string;
    notFound: string;
    serverError: string;
  }
): string {
  const defaultTexts = {
    unknown: "خطای ناشناخته",
    networkError: "خطا در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید.",
    unauthorized: "شما مجاز به انجام این عملیات نیستید. لطفاً دوباره وارد شوید.",
    forbidden: "شما دسترسی لازم برای انجام این عملیات را ندارید.",
    notFound: "منبع درخواستی یافت نشد.",
    serverError: "خطای سرور. لطفاً بعداً تلاش کنید.",
  };

  const texts = errorTexts ?? defaultTexts;
  const finalFallback = fallback ?? texts.unknown;
  const message = getErrorMessage(error, finalFallback);

  // Map common technical errors to user-friendly messages
  if (isNetworkError(error)) {
    return texts.networkError;
  }

  if (message.includes("401") || message.includes("unauthorized")) {
    return texts.unauthorized;
  }

  if (message.includes("403") || message.includes("forbidden")) {
    return texts.forbidden;
  }

  if (message.includes("404") || message.includes("not found")) {
    return texts.notFound;
  }

  if (message.includes("500") || message.includes("server error")) {
    return texts.serverError;
  }

  return message;
}
