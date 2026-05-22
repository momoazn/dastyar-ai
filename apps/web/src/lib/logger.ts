type LogContext = {
  [key: string]: unknown;
};

const serializeError = (error: unknown) => {
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
    console.error("[ERROR]", message, {
      context,
      error: serializeError(error),
    });
  },
};

export type { LogContext };
