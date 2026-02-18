const DEFAULT_ERROR_TEXTS = {
  unknown: "خطای ناشناخته",
  badRequest: "درخواست شما نامعتبر است. لطفاً ورودی‌ها را بررسی کنید.",
  networkError: "خطا در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید.",
  unauthorized: "شما مجاز به انجام این عملیات نیستید. لطفاً دوباره وارد شوید.",
  forbidden: "شما دسترسی لازم برای انجام این عملیات را ندارید.",
  notFound: "منبع درخواستی یافت نشد.",
  serverError: "خطای سرور. لطفاً بعداً تلاش کنید.",
  tokenExpired: "نشست شما منقضی شده است. لطفاً دوباره وارد شوید.",
} as const;

function normalizeMessage(message: string): string {
  return message.trim().toLowerCase();
}

function containsPersianText(text: string): boolean {
  return /[\u0600-\u06ff]/.test(text);
}

function mapMessageToFriendlyText(
  message: string,
  texts: {
    unknown: string;
    badRequest: string;
    networkError: string;
    unauthorized: string;
    forbidden: string;
    notFound: string;
    serverError: string;
    tokenExpired: string;
  }
): string {
  const normalized = normalizeMessage(message);

  if (
    normalized.includes("token_expired") ||
    normalized.includes("token expired") ||
    normalized.includes("jwt expired") ||
    normalized.includes("توکن منقضی")
  ) {
    return texts.tokenExpired;
  }

  if (
    normalized.includes("400") ||
    normalized.includes("bad request") ||
    normalized.includes("bad_request") ||
    normalized.includes("invalid request") ||
    normalized.includes("invalid input") ||
    normalized.includes("validation error") ||
    normalized.includes("malformed request") ||
    normalized.includes("unprocessable")
  ) {
    return texts.badRequest;
  }

  if (
    normalized.includes("401") ||
    normalized.includes("unauthorized") ||
    normalized.includes("invalid token") ||
    normalized.includes("missing_auth_header")
  ) {
    return texts.unauthorized;
  }

  if (normalized.includes("403") || normalized.includes("forbidden")) {
    return texts.forbidden;
  }

  if (normalized.includes("404") || normalized.includes("not found")) {
    return texts.notFound;
  }

  if (normalized.includes("500") || normalized.includes("server error")) {
    return texts.serverError;
  }

  if (normalized.includes("internal server error")) {
    return texts.serverError;
  }

  if (
    !containsPersianText(message) &&
    (normalized.includes("error") ||
      normalized.includes("failed") ||
      normalized.includes("exception") ||
      normalized.includes("stack") ||
      normalized.includes("http "))
  ) {
    return texts.unknown;
  }

  return message;
}

function extractMessageFromObject(error: object): string | undefined {
  if ("message" in error && typeof error.message === "string") {
    return error.message;
  }

  if ("error" in error && error.error && typeof error.error === "object") {
    const nestedError = error.error as { message?: unknown };
    if (typeof nestedError.message === "string") {
      return nestedError.message;
    }
  }

  if ("cause" in error && error.cause && typeof error.cause === "object") {
    const cause = error.cause as { message?: unknown };
    if (typeof cause.message === "string") {
      return cause.message;
    }
  }
}

/**
 * Extract error message from unknown error type
 * Handles Error instances, string errors, and other types
 */
export function getErrorMessage(error: unknown, fallback?: string): string {
  const defaultFallback = DEFAULT_ERROR_TEXTS.unknown;
  const finalFallback: string = fallback ?? defaultFallback;
  if (error instanceof Error) {
    const rawMessage = error.message || finalFallback;
    return mapMessageToFriendlyText(rawMessage, DEFAULT_ERROR_TEXTS);
  }
  if (typeof error === "string") {
    return mapMessageToFriendlyText(error, DEFAULT_ERROR_TEXTS);
  }
  if (error && typeof error === "object") {
    const message = extractMessageFromObject(error);
    if (message) {
      return mapMessageToFriendlyText(message, DEFAULT_ERROR_TEXTS);
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
    badRequest?: string;
    networkError: string;
    unauthorized: string;
    forbidden: string;
    notFound: string;
    serverError: string;
    tokenExpired?: string;
  }
): string {
  const texts = {
    ...DEFAULT_ERROR_TEXTS,
    ...errorTexts,
    badRequest: errorTexts?.badRequest ?? DEFAULT_ERROR_TEXTS.badRequest,
    tokenExpired:
      errorTexts?.tokenExpired ?? DEFAULT_ERROR_TEXTS.tokenExpired,
  };
  const finalFallback = fallback ?? texts.unknown;
  const message = getErrorMessage(error, finalFallback);

  // Map common technical errors to user-friendly messages
  if (isNetworkError(error)) {
    return texts.networkError;
  }

  return mapMessageToFriendlyText(message, texts);
}
