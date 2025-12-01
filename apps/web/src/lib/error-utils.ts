/**
 * Extract error message from unknown error type
 * Handles Error instances, string errors, and other types
 */
export function getErrorMessage(
  error: unknown,
  fallback = "خطای ناشناخته"
): string {
  if (error instanceof Error) {
    return error.message || fallback;
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
  return fallback;
}

/**
 * Check if error is an Error instance
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}
