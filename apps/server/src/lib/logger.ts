// Simple logger utility with structured logging and context support
type LogLevel = "fatal" | "error" | "warn" | "info" | "debug" | "trace";

type LogContext = {
  [key: string]: unknown;
  correlationId?: string | number;
  requestId?: string | number;
  userId?: string | number;
  sessionId?: string | number;
};

type LogEntry = {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  performance?: {
    duration?: number;
    memory?: {
      used: number;
      total: number;
    };
  };
};

type LogOptions = {
  context?: LogContext;
  error?: unknown;
};

const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
} as const;

const LOG_LEVELS: Record<LogLevel, number> = {
  fatal: 100,
  error: 90,
  warn: 80,
  info: 70,
  debug: 60,
  trace: 50,
};

const CURRENT_LOG_LEVEL: LogLevel = "info";

const shouldLog = (level: LogLevel): boolean =>
  LOG_LEVELS[level] <= LOG_LEVELS[CURRENT_LOG_LEVEL];

const formatTimestamp = (date: Date = new Date()): string => date.toISOString();

const serializeError = (error: unknown) => {
  if (!error) return;

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as { code?: string }).code,
    };
  }

  return {
    name: "UnknownError",
    message: String(error),
    stack: undefined,
    code: undefined,
  };
};

// Write to stdout/stderr synchronously - works in both dev and compiled binaries
const writeStructuredLog = (entry: LogEntry, isError = false) => {
  const line = formatLogEntry(entry);
  const target = isError ? process.stderr : process.stdout;
  // Use sync write and ensure it's flushed immediately
  target.write(`${line}\n`);
  // Force flush in production binaries where buffering might occur
  const targetAny = target as { flush?: () => void };
  if (typeof targetAny.flush === "function") {
    targetAny.flush();
  }
};

const appendContextParts = (
  parts: string[],
  context: LogEntry["context"]
): void => {
  if (context?.correlationId || context?.requestId) {
    parts.push(
      `${COLORS.magenta}[${context.correlationId || context.requestId}]${COLORS.reset}`
    );
  }

  if (context && Object.keys(context).length > 0) {
    parts.push(`${COLORS.dim}${JSON.stringify(context)}${COLORS.reset}`);
  }
};

const appendErrorParts = (
  parts: string[],
  error: LogEntry["error"],
  color: string
): void => {
  if (error) {
    parts.push(`${color}Error: ${error.message}${COLORS.reset}`);
    if (error.stack) {
      parts.push(`${COLORS.dim}${error.stack}${COLORS.reset}`);
    }
  }
};

const appendPerformanceParts = (
  parts: string[],
  performance: LogEntry["performance"]
): void => {
  if (performance) {
    const perfParts: string[] = [];
    if (performance.duration !== undefined) {
      perfParts.push(`duration: ${performance.duration}ms`);
    }
    if (performance.memory) {
      perfParts.push(
        `memory: ${(performance.memory.used / 1024 / 1024).toFixed(2)}MB / ${(performance.memory.total / 1024 / 1024).toFixed(2)}MB`
      );
    }
    parts.push(`${COLORS.dim}[${perfParts.join(", ")}]${COLORS.reset}`);
  }
};

const formatLogEntry = (entry: LogEntry): string => {
  const { timestamp, level, message, context, error, performance } = entry;

  const useColors = process.stdout.isTTY;

  if (!useColors) {
    // Simple format without colors
    const parts = [`[${level.toUpperCase()}]`, timestamp, message];

    if (context && Object.keys(context).length > 0) {
      parts.push(JSON.stringify(context));
    }

    if (error) {
      parts.push(`Error: ${error.message}`);
      if (error.stack) {
        parts.push(error.stack);
      }
    }

    return parts.join(" ");
  }

  // Colored format for development
  const levelColors: Record<LogLevel, string> = {
    fatal: COLORS.red + COLORS.bright,
    error: COLORS.red,
    warn: COLORS.yellow,
    info: COLORS.cyan,
    debug: COLORS.blue,
    trace: COLORS.gray,
  };

  const color = levelColors[level];
  const reset = COLORS.reset;

  const parts = [
    `${color}[${level.toUpperCase()}]${reset}`,
    `${COLORS.dim}${timestamp}${reset}`,
    message,
  ];

  appendContextParts(parts, context);
  appendErrorParts(parts, error, color);
  appendPerformanceParts(parts, performance);

  return parts.join(" ");
};

const getMemoryInfo = () => {
  const usage = process.memoryUsage();
  return {
    used: usage.heapUsed,
    total: usage.heapTotal,
  };
};

const log = (
  level: LogLevel,
  message: string,
  { context, error }: LogOptions = {}
): void => {
  if (!shouldLog(level)) {
    return;
  }

  writeStructuredLog(
    {
      timestamp: formatTimestamp(),
      level,
      message,
      context,
      error: serializeError(error),
      performance: { memory: getMemoryInfo() },
    },
    level === "fatal" || level === "error"
  );
};

export const logger = {
  fatal: (message: string, error?: unknown, context?: LogContext) => {
    log("fatal", message, { context, error });
  },

  error: (message: string, error?: unknown, context?: LogContext) => {
    log("error", message, { context, error });
  },

  warn: (message: string, context?: LogContext) => {
    log("warn", message, { context });
  },

  info: (message: string, context?: LogContext) => {
    log("info", message, { context });
  },

  debug: (message: string, context?: LogContext) => {
    log("debug", message, { context });
  },

  trace: (message: string, context?: LogContext) => {
    log("trace", message, { context });
  },

  getLevel: () => CURRENT_LOG_LEVEL,
};

export type { LogLevel, LogContext, LogEntry };
