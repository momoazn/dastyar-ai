/**
 * Web-side logger utility
 * Provides structured logging for the frontend application
 * Only logs in development mode to avoid console noise in production
 */

type LogLevel = "error" | "warn" | "info" | "debug";

type LogContext = {
  [key: string]: unknown;
};

const isDev = import.meta.env.DEV;
const LOG_LEVEL = (
  import.meta.env.VITE_LOG_LEVEL || "info"
).toLowerCase() as LogLevel;

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 4,
  warn: 3,
  info: 2,
  debug: 1,
};

const shouldLog = (level: LogLevel): boolean => {
  if (!isDev && level !== "error") {
    return false;
  }
  return LOG_LEVELS[level] >= LOG_LEVELS[LOG_LEVEL];
};

const formatMessage = (message: string, context?: LogContext): string => {
  if (!context || Object.keys(context).length === 0) {
    return message;
  }
  return `${message} ${JSON.stringify(context)}`;
};

const serializeError = (
  error: unknown
):
  | {
      name: string;
      message: string;
      stack?: string;
    }
  | undefined => {
  if (!error) return;

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    name: "UnknownError",
    message: String(error),
  };
};

export const logger = {
  error: (message: string, error?: unknown, context?: LogContext) => {
    if (!shouldLog("error")) return;

    const errorInfo = serializeError(error);
    const formattedMessage = formatMessage(message, context);

    if (errorInfo) {
      console.error(`[ERROR] ${formattedMessage}`, errorInfo);
    } else {
      console.error(`[ERROR] ${formattedMessage}`);
    }
  },

  warn: (message: string, context?: LogContext) => {
    if (!shouldLog("warn")) return;
    console.warn(`[WARN] ${formatMessage(message, context)}`);
  },

  info: (message: string, context?: LogContext) => {
    if (!shouldLog("info")) return;
    console.info(`[INFO] ${formatMessage(message, context)}`);
  },

  debug: (message: string, context?: LogContext) => {
    if (!shouldLog("debug")) return;
    console.debug(`[DEBUG] ${formatMessage(message, context)}`);
  },
};

export type { LogLevel, LogContext };
